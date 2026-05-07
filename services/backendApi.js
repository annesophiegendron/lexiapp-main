import {Platform} from 'react-native';

const BACKEND_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://127.0.0.1:8000',
  default: 'http://127.0.0.1:8000',
});

const lireStatutEtape = etape => ({
  statut: etape?.statut || 'inconnu',
  modele: etape?.modele || '',
});

const normaliserPipelineIa = pipelineIa => ({
  transcription: lireStatutEtape(pipelineIa?.transcription),
  analyse: lireStatutEtape(pipelineIa?.analyse),
});

const normaliserCapture = capture => ({
  id: capture.id,
  original: capture.phrase_originale,
  translation: capture.traduction || '',
  audioUrl: `${BACKEND_BASE_URL}${capture.audio_url}`,
  audioPath: capture.audio_url,
  tags: Array.isArray(capture.contexte_tags) ? capture.contexte_tags : [],
  formality: capture.formalite,
  latitude: capture.geolocalisation?.latitude,
  longitude: capture.geolocalisation?.longitude,
  language: capture.langue || 'auto',
  addedDate: capture.timestamp || new Date().toISOString(),
  pipelineIa: normaliserPipelineIa(capture.pipeline_ia),
});

export const fetchCaptures = async () => {
  const response = await fetch(`${BACKEND_BASE_URL}/captures`);
  if (!response.ok) {
    throw new Error(`Impossible de charger les captures (${response.status}).`);
  }

  const payload = await response.json();
  return Array.isArray(payload.captures)
    ? payload.captures.map(normaliserCapture)
    : [];
};

export const createCapture = async ({
  audioUri,
  fileName,
  mimeType,
  latitude,
  longitude,
  language,
}) => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: fileName,
    type: mimeType,
  });
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('langue', language || 'fr');

  const response = await fetch(`${BACKEND_BASE_URL}/captures`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : `Erreur backend (${response.status}).`;
    throw new Error(detail);
  }

  return normaliserCapture(payload.capture);
};

export {BACKEND_BASE_URL};
