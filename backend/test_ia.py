import os
import sys
from pathlib import Path
dossier_projet = Path(__file__).resolve().parent

# chemin vers ffmpeg (oblig pr whisper)
chemin_ffmpeg = dossier_projet / "tools" / "ffmpeg" / "ffmpeg-8.1-essentials_build" / "bin"

# si ffmpeg existe on ajoute au PATH pour que whisper puisse le trouver
if chemin_ffmpeg.exists():
    os.environ["PATH"] = f"{chemin_ffmpeg}{os.pathsep}{os.environ.get('PATH', '')}"

import whisper

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
        # chargement modele
        print("chargement modele...")
        modele = whisper.load_model("base")

        # lancement transcription
        print("transcription en cours...")
        resultat = modele.transcribe(str(fichier_audio))

    except Exception as e:
        print(f"erreur transcription {e}")
        return 1

    # resultat
    print("\n--- resultat ---")
    print("fichier", fichier_audio)
    print("texte", resultat["text"].strip())

    return 0
if __name__ == "__main__":
    sys.exit(main())

    #lancer le test en ligne de commande : .\backend\venv311\Scripts\python.exe .\backend\test_ia.py .\backend\speech_anglais.wav
