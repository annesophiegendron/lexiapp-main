from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import logging
import uuid

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import httpx

from config import AUDIO_STORAGE_DIR, OLLAMA_URL
from database import (
    alimenter_donnees_demo,
    creer_capture,
    initialiser_base,
    lire_capture_par_id,
    lister_captures,
    verifier_sante_base,
)
from models import (
    Capture,
    CommandeCreationCapture,
    ReponseCaptures,
    ReponseCreationCapture,
    ReponseSante,
)
from ollama_client import analyser_phrase
from transcription import transcrire_audio

# Configuration du logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Dossier de stockage local des fichiers audio televerses depuis le mobile.
CHEMIN_STOCKAGE_AUDIOS = AUDIO_STORAGE_DIR


@asynccontextmanager
async def cycle_de_vie(_: FastAPI):
    # Prepare la base au demarrage et ajoute une donnee de demo si besoin.
    logger.info("Initialisation du backend Lexiapp...")
    initialiser_base()
    alimenter_donnees_demo()
    logger.info("Backend Lexiapp initialise avec succes")
    yield
    logger.info("Arrêt du backend Lexiapp")


app = FastAPI(
    title="Lexiapp backend API",
    description="Backend FastAPI avec PostgreSQL, Whisper local et analyse Ollama pour les captures.",
    lifespan=cycle_de_vie,
)

# Configuration CORS pour permettre les requetes du frontend React Native et web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, specifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Info"])
def accueil() -> dict:
    logger.info("Accueil API - requête root")
    return {
        "message": "Bienvenue sur le backend Lexiapp.",
        "documentation": "/docs",
        "sante": "/sante",
        "captures": "/captures",
    }


@app.get("/sante", response_model=ReponseSante, tags=["Health"])
def verification_sante() -> ReponseSante:
    # Verifie que le serveur, la base de donnees et Ollama sont operationnels
    logger.info("Vérification santé du système")
    
    # Verifier la base de donnees
    base_ok = verifier_sante_base()
    if not base_ok:
        logger.error("Base de données indisponible")
        raise HTTPException(
            status_code=503,
            detail="Base de données PostgreSQL indisponible"
        )
    
    # Verifier Ollama
    ollama_ok = False
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{OLLAMA_URL}/api/version")
            ollama_ok = response.status_code == 200
    except Exception as e:
        logger.warning(f"Ollama indisponible: {e}")
    
    return ReponseSante(
        status="ok" if ollama_ok else "degraded",
        message="Le serveur est prêt." if ollama_ok else "Serveur prêt mais Ollama indisponible (analyse désactivée)",
        version=2,
    )


@app.get("/captures", response_model=ReponseCaptures, tags=["Captures"])
def lire_captures() -> ReponseCaptures:
    logger.info("Récupération de la liste des captures")
    captures = lister_captures()
    logger.info(f"Retour de {len(captures)} captures")
    return ReponseCaptures(total=len(captures), captures=captures)


@app.get("/captures/{capture_id}", response_model=Capture, tags=["Captures"])
def lire_capture(capture_id: str) -> Capture:
    logger.info(f"Récupération de la capture {capture_id}")
    capture = lire_capture_par_id(capture_id)
    if not capture:
        logger.warning(f"Capture non trouvée: {capture_id}")
        raise HTTPException(status_code=404, detail=f"Capture {capture_id} non trouvée")
    return capture


async def enregistrer_audio(audio: UploadFile) -> str:
    # Sauvegarde l'audio brut localement avant transcription.
    CHEMIN_STOCKAGE_AUDIOS.mkdir(parents=True, exist_ok=True)
    extension = Path(audio.filename).suffix if audio.filename else ""
    nom_fichier = f"{uuid.uuid4().hex}{extension}"
    chemin_fichier = CHEMIN_STOCKAGE_AUDIOS / nom_fichier
    contenu = await audio.read()
    chemin_fichier.write_bytes(contenu)
    await audio.seek(0)
    return f"/stockage/audios/{nom_fichier}"


def resoudre_chemin_audio(url_audio: str) -> Path:
    # Convertit l'URL logique de stockage en chemin disque exploitable par Whisper.
    chemin_relatif = Path(url_audio.lstrip("/"))
    return Path(__file__).resolve().parent / chemin_relatif


@app.post("/captures", response_model=ReponseCreationCapture, tags=["Captures"])
async def creer_captures(
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    langue: Optional[str] = Form("fr"),
) -> ReponseCreationCapture:
    # Pipeline principal: validation du fichier, transcription, analyse semantique, persistence.
    logger.info(f"Création capture: audio={audio.filename}, lat={latitude}, lon={longitude}, langue={langue}")
    
    # Validation geolocalisation
    if not (-90 <= latitude <= 90):
        logger.error(f"Latitude invalide: {latitude}")
        raise HTTPException(
            status_code=400,
            detail="La latitude doit être entre -90 et 90"
        )
    if not (-180 <= longitude <= 180):
        logger.error(f"Longitude invalide: {longitude}")
        raise HTTPException(
            status_code=400,
            detail="La longitude doit être entre -180 et 180"
        )
    
    if not audio.filename:
        logger.error("Fichier audio sans nom")
        raise HTTPException(status_code=400, detail="Le fichier audio doit avoir un nom valide")

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        logger.error(f"Type de contenu invalide: {audio.content_type}")
        raise HTTPException(
            status_code=400,
            detail="Le fichier envoye doit etre un audio valide.",
        )

    url_audio = await enregistrer_audio(audio)
    chemin_audio = resoudre_chemin_audio(url_audio)

    try:
        logger.info(f"Transcription en cours pour {chemin_audio}")
        phrase_originale = transcrire_audio(chemin_audio, langue)
        logger.info(f"Transcription réussie: {phrase_originale[:50]}...")
    except Exception as exc:
        logger.error(f"Erreur transcription: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la transcription audio: {exc}",
        ) from exc

    try:
        logger.info(f"Analyse Ollama en cours pour: {phrase_originale[:50]}...")
        analyse = analyser_phrase(phrase_originale, langue)
        logger.info(f"Analyse réussie - tags: {analyse.get('tags')}")
    except Exception as e:
        # La capture reste enregistrable meme si Ollama est indisponible.
        logger.warning(f"Ollama indisponible, fallback: {e}")
        analyse = {
            "traduction": None,
            "tags": [],
            "formalite": "standard",
        }

    capture = creer_capture(
        CommandeCreationCapture(
            phrase_originale=phrase_originale,
            traduction=analyse["traduction"],
            audio_url=url_audio,
            contexte_tags=analyse["tags"],
            formalite=analyse["formalite"],
            latitude=latitude,
            longitude=longitude,
            langue=langue,
        )
    )
    
    logger.info(f"Capture créée avec succès: {capture.id}")

    return ReponseCreationCapture(
        status="success",
        message="Le fichier audio recu a ete enregistre.",
        capture=capture,
    )


if __name__ == "__main__":
    print("Le serveur Lexiapp demarre sur http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
