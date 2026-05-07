from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import logging
import uuid

import httpx
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

try:
    from backend.config import AUDIO_STORAGE_DIR, OLLAMA_URL, SEED_DEMO_DATA
    from backend.config import OLLAMA_MODEL, WHISPER_MODEL
    from backend.database import (
        alimenter_donnees_demo,
        creer_capture,
        initialiser_base,
        lire_capture_par_id,
        lister_captures,
        verifier_sante_base,
    )
    from backend.models import (
        Capture,
        CommandeCreationCapture,
        PipelineIA,
        ReponseCaptures,
        ReponseCreationCapture,
        ReponseSante,
        StatutEtapeIA,
    )
    from backend.ollama_client import analyser_phrase
    from backend.transcription import transcrire_audio
except ModuleNotFoundError:
    from config import AUDIO_STORAGE_DIR, OLLAMA_URL, SEED_DEMO_DATA
    from config import OLLAMA_MODEL, WHISPER_MODEL
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
        PipelineIA,
        ReponseCaptures,
        ReponseCreationCapture,
        ReponseSante,
        StatutEtapeIA,
    )
    from ollama_client import analyser_phrase
    from transcription import transcrire_audio

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

CHEMIN_STOCKAGE_AUDIOS = AUDIO_STORAGE_DIR


@asynccontextmanager
async def cycle_de_vie(_: FastAPI):
    logger.info("Initialisation du backend Lexiapp...")
    initialiser_base()
    if SEED_DEMO_DATA:
        alimenter_donnees_demo()
    logger.info("Backend Lexiapp initialise avec succes")
    yield
    logger.info("Arret du backend Lexiapp")


app = FastAPI(
    title="Lexiapp backend API",
    description="Backend FastAPI avec PostgreSQL, Whisper local et analyse Ollama pour les captures.",
    lifespan=cycle_de_vie,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Info"])
def accueil() -> dict:
    logger.info("Accueil API - requete root")
    return {
        "message": "Bienvenue sur le backend Lexiapp.",
        "documentation": "/docs",
        "sante": "/sante",
        "captures": "/captures",
    }


@app.get("/sante", response_model=ReponseSante, tags=["Health"])
def verification_sante() -> ReponseSante:
    logger.info("Verification sante du systeme")

    if not verifier_sante_base():
        logger.error("Base de donnees indisponible")
        raise HTTPException(
            status_code=503,
            detail="Base de donnees PostgreSQL indisponible",
        )

    ollama_ok = False
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{OLLAMA_URL}/api/version")
            ollama_ok = response.status_code == 200
    except Exception as exc:
        logger.warning(f"Ollama indisponible: {exc}")

    return ReponseSante(
        status="ok" if ollama_ok else "degraded",
        message="Le serveur est pret." if ollama_ok else "Serveur pret mais Ollama indisponible (analyse desactivee)",
        version=2,
    )


@app.get("/captures", response_model=ReponseCaptures, tags=["Captures"])
def lire_captures() -> ReponseCaptures:
    logger.info("Recuperation de la liste des captures")
    captures = lister_captures()
    logger.info(f"Retour de {len(captures)} captures")
    return ReponseCaptures(total=len(captures), captures=captures)


@app.get("/captures/{capture_id}", response_model=Capture, tags=["Captures"])
def lire_capture(capture_id: str) -> Capture:
    logger.info(f"Recuperation de la capture {capture_id}")
    capture = lire_capture_par_id(capture_id)
    if not capture:
        logger.warning(f"Capture non trouvee: {capture_id}")
        raise HTTPException(status_code=404, detail=f"Capture {capture_id} non trouvee")
    return capture


async def enregistrer_audio(audio: UploadFile) -> str:
    CHEMIN_STOCKAGE_AUDIOS.mkdir(parents=True, exist_ok=True)
    extension = Path(audio.filename).suffix if audio.filename else ""
    nom_fichier = f"{uuid.uuid4().hex}{extension}"
    chemin_fichier = CHEMIN_STOCKAGE_AUDIOS / nom_fichier
    contenu = await audio.read()
    chemin_fichier.write_bytes(contenu)
    await audio.seek(0)
    return f"/stockage/audios/{nom_fichier}"


def resoudre_chemin_audio(url_audio: str) -> Path:
    return CHEMIN_STOCKAGE_AUDIOS / Path(url_audio).name


def supprimer_audio_si_present(url_audio: str) -> None:
    chemin_audio = resoudre_chemin_audio(url_audio)
    if chemin_audio.exists():
        chemin_audio.unlink()


@app.get("/stockage/audios/{nom_fichier}", tags=["Stockage"])
def lire_audio_stocke(nom_fichier: str):
    chemin_audio = CHEMIN_STOCKAGE_AUDIOS / nom_fichier
    if not chemin_audio.exists():
        raise HTTPException(status_code=404, detail=f"Audio {nom_fichier} introuvable")
    return FileResponse(chemin_audio)


@app.post("/captures", response_model=ReponseCreationCapture, tags=["Captures"])
async def creer_captures(
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    langue: Optional[str] = Form("fr"),
) -> ReponseCreationCapture:
    logger.info(f"Creation capture: audio={audio.filename}, lat={latitude}, lon={longitude}, langue={langue}")

    if not (-90 <= latitude <= 90):
        logger.error(f"Latitude invalide: {latitude}")
        raise HTTPException(
            status_code=400,
            detail="La latitude doit etre entre -90 et 90",
        )
    if not (-180 <= longitude <= 180):
        logger.error(f"Longitude invalide: {longitude}")
        raise HTTPException(
            status_code=400,
            detail="La longitude doit etre entre -180 et 180",
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
        statut_transcription = StatutEtapeIA(statut="ok", modele=WHISPER_MODEL)
        logger.info(f"Transcription reussie: {phrase_originale[:50]}...")
    except Exception as exc:
        supprimer_audio_si_present(url_audio)
        logger.error(f"Erreur transcription: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la transcription audio: {exc}",
        ) from exc

    try:
        logger.info(f"Analyse Ollama en cours pour: {phrase_originale[:50]}...")
        analyse = analyser_phrase(phrase_originale, langue)
        statut_analyse = StatutEtapeIA(statut="ok", modele=OLLAMA_MODEL)
        logger.info(f"Analyse reussie - tags: {analyse.get('tags')}")
    except Exception as exc:
        logger.warning(f"Ollama indisponible, fallback: {exc}")
        analyse = {
            "traduction": None,
            "tags": [],
            "formalite": "standard",
        }
        statut_analyse = StatutEtapeIA(statut="fallback", modele=OLLAMA_MODEL)

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
            pipeline_ia=PipelineIA(
                transcription=statut_transcription,
                analyse=statut_analyse,
            ),
        )
    )

    logger.info(f"Capture creee avec succes: {capture.id}")

    return ReponseCreationCapture(
        status="success",
        message="Le fichier audio recu a ete enregistre.",
        capture=capture,
        pipeline_ia=capture.pipeline_ia,
    )


if __name__ == "__main__":
    print("Le serveur Lexiapp demarre sur http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
