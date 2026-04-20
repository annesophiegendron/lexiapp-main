from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile


app = FastAPI(
    title="Lexiapp backend mock API",
    description="Squelette FastAPI pour la phase de mock du backend Lexiapp.",
)

MOCK_CAPTURES = [
    {
        "id": "capture-001",
        "phrase_originale": "texte transcrit par l'ia (pour l'instant c'est un mock)",
        "traduction": "traduction de la phrase (pour l'instant c'est un mock)",
        "audio_url": "/stockage/audios/exemple.wav",
        "contexte_tags": ["voyage", "situation-reelle"],
        "formalite": "standard",
        "geolocalisation": {
            "latitude": 48.8566,  # Coordonnees de Paris pour le mock.
            "longitude": 2.3522,
        },
    }
]


@app.get("/sante")
def verification_sante():
    return {
        "status": "ok",
        "message": "Le serveur est pret a recevoir des requetes.",
        "version": 1,
    }


@app.get("/captures")
def lire_captures():
    return {
        "total": len(MOCK_CAPTURES),
        "captures": MOCK_CAPTURES,
    }


@app.post("/captures")
async def creer_captures(
    audio: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    langue: Optional[str] = Form("fr"),
):
    """Recoit une capture audio et renvoie une reponse mock de phase 1."""
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Le fichier audio doit avoir un nom valide")

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier envoye doit etre un audio valide.",
        )

    capture = {
        "id": "capture-mock-002",
        "phrase_originale": "texte transcrit par l'ia (pour l'instant c'est un mock)",
        "traduction": "traduction de la phrase (pour l'instant c'est un mock)",
        "audio_url": f"/stockage/audios/{audio.filename}",
        "contexte_tags": ["voyage", "situation-reelle"],
        "formalite": "standard",
        "geolocalisation": {
            "latitude": latitude,
            "longitude": longitude,
        },
        "langue": langue,
    }

    return {
        "status": "success",
        "message": "Le fichier audio recu est pret a etre traite.",
        "capture": capture,
    }


if __name__ == "__main__":
    print("Le serveur mock de Lexiapp demarre sur http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
