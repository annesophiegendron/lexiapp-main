import os
from pathlib import Path

from dotenv import load_dotenv


# Charge la configuration locale du backend depuis backend/.env.
DOSSIER_BACKEND = Path(__file__).resolve().parent
load_dotenv(DOSSIER_BACKEND / ".env")

# Parametres centralises pour la base, Ollama et le stockage audio local.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lexiapp")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
AUDIO_STORAGE_DIR = Path(os.getenv("AUDIO_STORAGE_DIR", str(DOSSIER_BACKEND / "stockage" / "audios"))).resolve()
