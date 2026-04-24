import sys
from pathlib import Path

from transcription import transcrire_audio

def main():
    # verif si arg present
    if len(sys.argv) < 2:
        print("utilisation python test_ia.py <fichier_audio>")
        return 1
   
    fichier_audio = Path(sys.argv[1]).expanduser().resolve()
    if not fichier_audio.exists():
        print(f"fichier introuvable {fichier_audio}")
        return 1

    try:
        # lancement transcription
        print("transcription en cours...")
        texte = transcrire_audio(fichier_audio)

    except Exception as e:
        print(f"erreur transcription {e}")
        return 1

    # resultat
    print("\n--- resultat ---")
    print("fichier", fichier_audio)
    print("texte", texte)

    return 0
if __name__ == "__main__":
    sys.exit(main())

    #lancer le test en ligne de commande : .\backend\venv311\Scripts\python.exe .\backend\test_ia.py .\backend\speech_anglais.wav
