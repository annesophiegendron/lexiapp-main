import os
from pathlib import Path
from typing import Optional


DOSSIER_BACKEND = Path(__file__).resolve().parent
CHEMIN_FFMPEG = DOSSIER_BACKEND / "tools" / "ffmpeg" / "ffmpeg-8.1-essentials_build" / "bin"

_modele_cache = None


def configurer_ffmpeg() -> None:
    if CHEMIN_FFMPEG.exists():
        os.environ["PATH"] = f"{CHEMIN_FFMPEG}{os.pathsep}{os.environ.get('PATH', '')}"


def charger_modele(nom_modele: str = "base"):
    global _modele_cache

    if _modele_cache is None:
        import whisper

        configurer_ffmpeg()
        _modele_cache = whisper.load_model(nom_modele)

    return _modele_cache


def transcrire_audio(chemin_audio: Path, langue: Optional[str] = None) -> str:
    modele = charger_modele()

    options = {}
    if langue:
        options["language"] = langue

    resultat = modele.transcribe(str(chemin_audio), **options)
    return resultat["text"].strip()
