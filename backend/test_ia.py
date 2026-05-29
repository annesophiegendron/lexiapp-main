import os
import sys
from pathlib import Path

try:
    from backend.ollama_client import analyser_phrase
except ModuleNotFoundError:
    from ollama_client import analyser_phrase


def _chemin_python_venv() -> Path | None:
    racine = Path(__file__).resolve().parent
    candidats = [
        racine / "venv311" / "Scripts" / "python.exe",
        racine / "venv" / "Scripts" / "python.exe",
        racine / "venv311" / "bin" / "python",
        racine / "venv" / "bin" / "python",
    ]
    for candidat in candidats:
        if candidat.exists():
            return candidat
    return None


def _whisper_disponible() -> bool:
    try:
        import whisper  # noqa: F401
    except ModuleNotFoundError:
        return False
    return True


def _basculer_vers_venv_si_besoin() -> None:
    if _whisper_disponible():
        return

    python_venv = _chemin_python_venv()
    if python_venv is None:
        return

    if Path(sys.executable).resolve() == python_venv.resolve():
        return

    print(f"whisper indisponible avec {sys.executable}, bascule vers {python_venv}")
    os.execv(str(python_venv), [str(python_venv), str(Path(__file__).resolve()), *sys.argv[1:]])


def main():
    if len(sys.argv) < 2:
        print("utilisation python test_ia.py <fichier_audio>")
        return 1

    _basculer_vers_venv_si_besoin()

    try:
        from backend.transcription import transcrire_audio
    except ModuleNotFoundError:
        from transcription import transcrire_audio

    fichier_audio = Path(sys.argv[1]).expanduser().resolve()
    if not fichier_audio.exists():
        print(f"fichier introuvable {fichier_audio}")
        return 1

    try:
        print("transcription en cours...")
        texte = transcrire_audio(fichier_audio)
        print("analyse ollama en cours...")
        analyse = analyser_phrase(texte)

    except Exception as e:
        print(f"erreur pipeline ia {e}")
        return 1

    print("\n--- resultat ---")
    print("fichier", fichier_audio)
    print("texte", texte)
    print("traduction", analyse.get("traduction"))
    print("tags", analyse.get("tags"))
    print("formalite", analyse.get("formalite"))

    return 0


if __name__ == "__main__":
    sys.exit(main())
