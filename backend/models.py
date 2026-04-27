from typing import List, Optional

from pydantic import BaseModel


class Geolocalisation(BaseModel):
    latitude: float
    longitude: float


class Capture(BaseModel):
    id: str
    phrase_originale: str
    traduction: Optional[str] = None
    audio_url: str
    contexte_tags: List[str]
    formalite: str
    geolocalisation: Geolocalisation
    langue: Optional[str] = None
    timestamp: Optional[str] = None


class ReponseSante(BaseModel):
    status: str
    message: str
    version: int


class ReponseCaptures(BaseModel):
    total: int
    captures: List[Capture]


class ReponseCreationCapture(BaseModel):
    status: str
    message: str
    capture: Capture


class CommandeCreationCapture(BaseModel):
    phrase_originale: str
    traduction: Optional[str] = None
    audio_url: str
    contexte_tags: List[str]
    formalite: str
    latitude: float
    longitude: float
    langue: Optional[str] = None
