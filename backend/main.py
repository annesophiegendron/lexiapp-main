from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional, List, Optional
import uvicorn


app = FastAPI(title="Lexiapp partie back end phase num 1")

@app.get("/sante")
def verfication_sante():
    return {
        "status": "ok",
        "message": "Le serveur est pret a recevoir des requetes",
        "version": 1
    }
@app.post("/captures")
async def creer_captures(
    # obligation de mettre un fichier audio sinon erreur
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    langue: Optional[str] = Form("fr")

):
    """ fonction principale pour enregistrer une nouvelle phrase
    pour aujourd'hui on va juste renvoyer un mock 
    et demain on s'attaquera a la partie transcription avec Whisper etc
    """
    return {
        "id": "id unique",
        "phrase": "texte transcrit par l'ia (pour l'instant c'est un mock)",
        "traduction": "traduction de la phrase (pour l'instant c'est un mock)",
        "audio_url": f"/stockage/audios /{audio.filename}",
        "contexte_tags": ["voyage", "situation-réelle"],
        "formalite": "standard",
        "geolocalisation": {
            "latitude": latitude, 
            "longitude": longitude
        },
        "message": "le fichier audio recu est pret a etre traite"
    }



if __name__ == "__main__":
    print("le serveur de Lexiapp est en train de demarrer...")
    uvicorn.run(app, host="0.0.0.0", port=8000)