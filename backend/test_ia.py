import sys
from pathlib import Path

try:
    from backend.ollama_client import analyser_phrase
    from backend.transcription import transcrire_audio
except ModuleNotFoundError:
    from ollama_client import analyser_phrase
    from transcription import transcrire_audio


def main():
    if len(sys.argv) < 2:
        print("utilisation python test_ia.py <fichier_audio>")
        return 1

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
