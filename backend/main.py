from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
import uuid

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from config import AUDIO_STORAGE_DIR
from database import alimenter_donnees_demo, creer_capture, initialiser_base, lister_captures
from models import (
    CommandeCreationCapture,
    ReponseCaptures,
    ReponseCreationCapture,
    ReponseSante,
)
from ollama_client import analyser_phrase
from transcription import transcrire_audio

# Dossier de stockage local des fichiers audio televerses depuis le mobile.
CHEMIN_STOCKAGE_AUDIOS = AUDIO_STORAGE_DIR


@asynccontextmanager
async def cycle_de_vie(_: FastAPI):
    # Prepare la base au demarrage et ajoute une donnee de demo si besoin.
    initialiser_base()
    alimenter_donnees_demo()
    yield


app = FastAPI(
    title="Lexiapp backend API",
    description="Backend FastAPI avec PostgreSQL, Whisper local et analyse Ollama pour les captures.",
    lifespan=cycle_de_vie,
)


@app.get("/")
def accueil() -> dict:
    return {
        "message": "Bienvenue sur le backend Lexiapp.",
        "documentation": "/docs",
        "sante": "/sante",
        "captures": "/captures",
    }


@app.get("/sante", response_model=ReponseSante)
def verification_sante() -> ReponseSante:
    return ReponseSante(
        status="ok",
        message="Le serveur est pret a recevoir des requetes.",
        version=2,
    )


@app.get("/captures", response_model=ReponseCaptures)
def lire_captures() -> ReponseCaptures:
    captures = lister_captures()
    return ReponseCaptures(total=len(captures), captures=captures)


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


@app.post("/captures", response_model=ReponseCreationCapture)
async def creer_captures(
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    langue: Optional[str] = Form("fr"),
) -> ReponseCreationCapture:
    # Pipeline principal: validation du fichier, transcription, analyse semantique, persistence.
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Le fichier audio doit avoir un nom valide")

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier envoye doit etre un audio valide.",
        )

    url_audio = await enregistrer_audio(audio)
    chemin_audio = resoudre_chemin_audio(url_audio)

    try:
        phrase_originale = transcrire_audio(chemin_audio, langue)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la transcription audio: {exc}",
        ) from exc

    try:
        analyse = analyser_phrase(phrase_originale, langue)
    except Exception:
        # La capture reste enregistrable meme si Ollama est indisponible.
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

    return ReponseCreationCapture(
        status="success",
        message="Le fichier audio recu a ete enregistre.",
        capture=capture,
    )


if __name__ == "__main__":
    print("Le serveur Lexiapp demarre sur http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
