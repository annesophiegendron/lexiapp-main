from importlib import metadata
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import urlopen

try:
    from backend.config import AUDIO_STORAGE_DIR, DATABASE_URL, OLLAMA_MODEL, OLLAMA_URL, WHISPER_MODEL
except ModuleNotFoundError:
    from config import AUDIO_STORAGE_DIR, DATABASE_URL, OLLAMA_MODEL, OLLAMA_URL, WHISPER_MODEL


DOSSIER_BACKEND = Path(__file__).resolve().parent
CHEMIN_FFMPEG_BUNDLE = DOSSIER_BACKEND / "tools" / "ffmpeg" / "ffmpeg-8.1-essentials_build" / "bin"


def extraire_hote_et_port_postgres(database_url: str) -> tuple[str, int] | tuple[None, None]:
    if not database_url.startswith(("postgresql://", "postgres://")):
        return None, None

    analyse = urlparse(database_url)
    if not analyse.hostname:
        return None, None

    try:
        port = analyse.port or 5432
    except ValueError:
        return None, None

    return analyse.hostname, port


def test_port(hote: str, port: int, timeout: float = 2.0) -> bool:
    try:
        with socket.create_connection((hote, port), timeout=timeout):
            return True
    except OSError:
        return False


def distribution_installee(nom_distribution: str) -> bool:
    try:
        metadata.version(nom_distribution)
        return True
    except metadata.PackageNotFoundError:
        return False


def commande_disponible(nom: str) -> bool:
    return shutil.which(nom) is not None


def ollama_modele_present(nom_modele: str) -> bool:
    try:
        resultat = subprocess.run(
            ["ollama", "list"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

    lignes = resultat.stdout.lower().splitlines()
    cible = nom_modele.lower()
    return any(ligne.split()[0] == cible or ligne.split()[0] == f"{cible}:latest" for ligne in lignes[1:] if ligne.strip())


def test_http(url: str, timeout: float = 3.0) -> bool:
    try:
        with urlopen(url, timeout=timeout) as response:
            return 200 <= response.status < 300
    except (URLError, TimeoutError, OSError):
        return False


def collecter_preflight() -> list[dict[str, str]]:
    resultats: list[tuple[str, str, str]] = []

    def ajouter(statut: str, sujet: str, detail: str) -> None:
        resultats.append((statut, sujet, detail))

    ajouter("OK" if distribution_installee("fastapi") else "FAIL", "fastapi", "Framework API disponible")
    ajouter("OK" if distribution_installee("httpx") else "FAIL", "httpx", "Client HTTP disponible")
    ajouter(
        "OK" if distribution_installee("psycopg") else "FAIL",
        "psycopg",
        "Driver PostgreSQL requis pour la base locale",
    )
    ajouter(
        "OK" if distribution_installee("openai-whisper") else "FAIL",
        "openai-whisper",
        f"Transcription locale requise, modele configure: {WHISPER_MODEL}",
    )

    ffmpeg_ok = commande_disponible("ffmpeg") or CHEMIN_FFMPEG_BUNDLE.exists()
    ajouter(
        "OK" if ffmpeg_ok else "FAIL",
        "ffmpeg",
        "Disponible dans le PATH ou dans backend/tools/ffmpeg",
    )

    AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    ajouter("OK", "stockage audio", str(AUDIO_STORAGE_DIR))

    ollama_cli = commande_disponible("ollama")
    ajouter("OK" if ollama_cli else "FAIL", "ollama CLI", "Commande ollama accessible")

    ollama_api = test_http(f"{OLLAMA_URL}/api/version")
    ajouter("OK" if ollama_api else "FAIL", "ollama API", f"Endpoint {OLLAMA_URL}/api/version")

    modele_present = ollama_modele_present(OLLAMA_MODEL) if ollama_cli else False
    ajouter(
        "OK" if modele_present else "FAIL",
        "modele ollama",
        f"Modele configure: {OLLAMA_MODEL}",
    )

    hote_pg, port_pg = extraire_hote_et_port_postgres(DATABASE_URL)
    if hote_pg is None or port_pg is None:
        ajouter("WARN", "postgresql", f"DATABASE_URL non PostgreSQL: {DATABASE_URL}")
    else:
        ajouter(
            "OK" if test_port(hote_pg, port_pg) else "FAIL",
            "postgresql TCP",
            f"{hote_pg}:{port_pg}",
        )

    return [
        {
            "statut": statut,
            "sujet": sujet,
            "detail": detail,
        }
        for statut, sujet, detail in resultats
    ]


def resumer_preflight(resultats: list[dict[str, str]]) -> dict[str, str]:
    echec = any(resultat["statut"] == "FAIL" for resultat in resultats)
    warning = any(resultat["statut"] == "WARN" for resultat in resultats)

    if echec:
        return {
            "status": "degraded",
            "message": "Environnement incomplet pour la phase 2.",
        }

    if warning:
        return {
            "status": "warning",
            "message": "Environnement exploitable avec avertissements.",
        }

    return {
        "status": "ok",
        "message": "Environnement coherent pour continuer la phase 2.",
    }


def main() -> int:
    resultats = collecter_preflight()
    resume = resumer_preflight(resultats)

    print("Verification Phase 2 - Lexiapp")
    print("=" * 36)
    for resultat in resultats:
        print(f"[{resultat['statut']}] {resultat['sujet']}: {resultat['detail']}")

    print(f"\nResultat: {resume['message']}")
    if resume["status"] == "degraded":
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
