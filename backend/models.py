from typing import List, Optional

from pydantic import BaseModel


class Geolocalisation(BaseModel):
    latitude: float
    longitude: float


class ReponseSante(BaseModel):
    status: str
    message: str
    version: int


class StatutEtapeIA(BaseModel):
    statut: str
    modele: Optional[str] = None


class PipelineIA(BaseModel):
    transcription: StatutEtapeIA
    analyse: StatutEtapeIA


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
    pipeline_ia: Optional[PipelineIA] = None


class ReponseCaptures(BaseModel):
    total: int
    captures: List[Capture]


class ReponseCreationCapture(BaseModel):
    status: str
    message: str
    capture: Capture
    pipeline_ia: PipelineIA


class CommandeCreationCapture(BaseModel):
    phrase_originale: str
    traduction: Optional[str] = None
    audio_url: str
    contexte_tags: List[str]
    formalite: str
    latitude: float
    longitude: float
    langue: Optional[str] = None
    pipeline_ia: Optional[PipelineIA] = None
