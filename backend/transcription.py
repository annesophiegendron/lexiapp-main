import os
from pathlib import Path
from typing import Optional

try:
    from backend.config import WHISPER_MODEL
except ModuleNotFoundError:
    from config import WHISPER_MODEL


# Prepare le chemin local de ffmpeg si l'outil est fourni dans backend/tools.
DOSSIER_BACKEND = Path(__file__).resolve().parent
CHEMIN_FFMPEG = DOSSIER_BACKEND / "tools" / "ffmpeg" / "ffmpeg-8.1-essentials_build" / "bin"

_modele_cache = None


def configurer_ffmpeg() -> None:
    if CHEMIN_FFMPEG.exists():
        os.environ["PATH"] = f"{CHEMIN_FFMPEG}{os.pathsep}{os.environ.get('PATH', '')}"


def charger_modele(nom_modele: Optional[str] = None):
    # Charge Whisper une seule fois pour eviter de reinitialiser le modele a chaque requete.
    global _modele_cache

    if _modele_cache is None:
        import whisper

        if not hasattr(whisper, "load_model"):
            module_path = getattr(whisper, "__file__", "inconnu")
            raise RuntimeError(
                "Le module Python 'whisper' charge n'est pas OpenAI Whisper "
                f"(module detecte: {module_path}). Installe le paquet 'openai-whisper'."
            )

        configurer_ffmpeg()
        _modele_cache = whisper.load_model(nom_modele or WHISPER_MODEL)

    return _modele_cache


def transcrire_audio(chemin_audio: Path, langue: Optional[str] = None) -> str:
    # Retourne uniquement le texte final nettoye pour le pipeline backend.
    modele = charger_modele()

    options = {}
    if langue:
        options["language"] = langue

    resultat = modele.transcribe(str(chemin_audio), **options)
    return resultat["text"].strip()
