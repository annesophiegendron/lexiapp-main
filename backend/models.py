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


class HealthResponse(BaseModel):
    status: str
    message: str
    version: int


class CapturesResponse(BaseModel):
    total: int
    captures: List[Capture]


class CreateCaptureResponse(BaseModel):
    status: str
    message: str
    capture: Capture
