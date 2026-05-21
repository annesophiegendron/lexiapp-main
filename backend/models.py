from typing import List, Optional

from pydantic import BaseModel, Field


class Geolocalisation(BaseModel):
    latitude: float
    longitude: float


class ReponseSante(BaseModel):
    status: str
    message: str
    version: int


class VerificationPreflight(BaseModel):
    statut: str
    sujet: str
    detail: str


class ReponsePreflight(BaseModel):
    status: str
    message: str
    checks: List[VerificationPreflight]


class StatutEtapeIA(BaseModel):
    statut: str
    modele: Optional[str] = None
    detail: Optional[str] = None


class PipelineIA(BaseModel):
    transcription: StatutEtapeIA
    analyse: StatutEtapeIA


class EtatRevision(BaseModel):
    repetitions: int
    intervalle_jours: int
    facteur_aisance: float
    prochaine_revision: Optional[str] = None
    derniere_revision: Optional[str] = None


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
    revision_srs: Optional[EtatRevision] = None


class ReponseCaptures(BaseModel):
    total: int
    captures: List[Capture]


class ReponseCreationCapture(BaseModel):
    status: str
    message: str
    capture: Capture
    pipeline_ia: PipelineIA


class CommandeNotationRevision(BaseModel):
    qualite: int = Field(ge=0, le=5)


class ReponseRevisionCapture(BaseModel):
    status: str
    message: str
    capture: Capture
    revision_srs: EtatRevision


class ReponseRevisionsDue(BaseModel):
    total: int
    captures: List[Capture]


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
