from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
import uuid

import httpx
from fastapi import UploadFile

try:
    from backend.config import (
        AUDIO_STORAGE_DIR,
        STORAGE_BACKEND,
        SUPABASE_BUCKET,
        SUPABASE_PUBLIC_BASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_URL,
    )
except ModuleNotFoundError:
    from config import (
        AUDIO_STORAGE_DIR,
        STORAGE_BACKEND,
        SUPABASE_BUCKET,
        SUPABASE_PUBLIC_BASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_URL,
    )


def stockage_est_supabase() -> bool:
    return STORAGE_BACKEND == "supabase"


def url_audio_est_absolue(url_audio: str) -> bool:
    return url_audio.startswith("http://") or url_audio.startswith("https://")


def generer_nom_fichier(nom_original: Optional[str]) -> str:
    extension = Path(nom_original or "").suffix
    return f"{uuid.uuid4().hex}{extension}"


async def enregistrer_audio(audio: UploadFile) -> str:
    if stockage_est_supabase():
        return await enregistrer_audio_supabase(audio)
    return await enregistrer_audio_local(audio)


async def enregistrer_audio_local(audio: UploadFile) -> str:
    AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    nom_fichier = generer_nom_fichier(audio.filename)
    chemin_fichier = AUDIO_STORAGE_DIR / nom_fichier
    contenu = await audio.read()
    chemin_fichier.write_bytes(contenu)
    await audio.seek(0)
    return f"/stockage/audios/{nom_fichier}"


async def enregistrer_audio_supabase(audio: UploadFile) -> str:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_BUCKET:
        raise RuntimeError("Configuration Supabase Storage incomplete.")

    nom_fichier = generer_nom_fichier(audio.filename)
    chemin_objet = f"audios/{nom_fichier}"
    contenu = await audio.read()
    await audio.seek(0)

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "x-upsert": "false",
        "Content-Type": audio.content_type or "application/octet-stream",
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{chemin_objet}",
            headers=headers,
            content=contenu,
        )
        response.raise_for_status()

    if SUPABASE_PUBLIC_BASE_URL:
        return f"{SUPABASE_PUBLIC_BASE_URL}/{chemin_objet}"

    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{chemin_objet}"


def resoudre_chemin_audio_local(url_audio: str) -> Optional[Path]:
    if url_audio_est_absolue(url_audio):
        return None

    nom_fichier = Path(urlparse(url_audio).path).name
    if not nom_fichier:
        return None

    return AUDIO_STORAGE_DIR / nom_fichier


def supprimer_audio_si_present(url_audio: str) -> None:
    chemin_audio = resoudre_chemin_audio_local(url_audio)
    if chemin_audio and chemin_audio.exists():
        chemin_audio.unlink()
