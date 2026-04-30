import json
from typing import Any, Dict, Optional

import httpx

try:
    from backend.config import OLLAMA_MODEL, OLLAMA_URL
except ModuleNotFoundError:
    from config import OLLAMA_MODEL, OLLAMA_URL

PROMPT_SYSTEME = (
    "Tu es un assistant linguistique. "
    "Retourne uniquement un JSON valide avec les cles "
    '"traduction", "tags", "formalite". '
    "Le champ tags doit etre une liste de chaines courtes. "
    'Le champ formalite doit etre l\'une des valeurs suivantes: "familier", "standard", "soutenu".'
)


def analyser_phrase(texte: str, langue: Optional[str] = None) -> Dict[str, Any]:
    prompt_utilisateur = (
        f"{PROMPT_SYSTEME}\n"
        f"Phrase a analyser: {texte}\n"
        f"Langue source si elle est connue: {langue or 'auto'}\n"
        "Retourne seulement le JSON final, sans markdown."
    )

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "stream": False,
                "prompt": prompt_utilisateur,
            },
        )
        response.raise_for_status()

    payload = response.json()
    contenu = payload.get("response", "{}")
    debut_json = contenu.find("{")
    fin_json = contenu.rfind("}")
    if debut_json == -1 or fin_json == -1 or fin_json < debut_json:
        raise ValueError("Ollama n'a pas retourne de JSON exploitable.")

    # Tolere les modeles qui entourent encore le JSON avec du texte parasite.
    resultat = json.loads(contenu[debut_json : fin_json + 1])

    return {
        "traduction": resultat.get("traduction"),
        "tags": resultat.get("tags") if isinstance(resultat.get("tags"), list) else [],
        "formalite": resultat.get("formalite", "standard"),
    }
