import {Platform} from 'react-native';

const BACKEND_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://127.0.0.1:8000',
  default: 'http://127.0.0.1:8000',
});

const lireStatutEtape = etape => ({
  statut: etape?.statut || 'inconnu',
  modele: etape?.modele || '',
  detail: etape?.detail || '',
});

const normaliserPipelineIa = pipelineIa => ({
  transcription: lireStatutEtape(pipelineIa?.transcription),
  analyse: lireStatutEtape(pipelineIa?.analyse),
});

const normaliserSanteBackend = payload => ({
  status: payload?.status || 'indisponible',
  message: payload?.message || 'Backend indisponible.',
  version: typeof payload?.version === 'number' ? payload.version : null,
});

const normaliserPreflight = payload => {
  const checks = Array.isArray(payload?.checks) ? payload.checks : [];

  return {
    status: payload?.status || 'indisponible',
    message: payload?.message || 'Verification preflight indisponible.',
    checks: checks.map(check => ({
      statut: check?.statut || 'INCONNU',
      sujet: check?.sujet || 'inconnu',
      detail: check?.detail || '',
    })),
  };
};

const normaliserCapture = capture => ({
  id: capture.id,
  original: capture.phrase_originale,
  translation: capture.traduction || '',
  audioUrl:
    typeof capture.audio_url === 'string' &&
    (capture.audio_url.startsWith('http://') ||
      capture.audio_url.startsWith('https://'))
      ? capture.audio_url
      : `${BACKEND_BASE_URL}${capture.audio_url}`,
  audioPath: capture.audio_url,
  tags: Array.isArray(capture.contexte_tags) ? capture.contexte_tags : [],
  formality: capture.formalite,
  latitude: capture.geolocalisation?.latitude,
  longitude: capture.geolocalisation?.longitude,
  language: capture.langue || 'auto',
  addedDate: capture.timestamp || new Date().toISOString(),
  pipelineIa: normaliserPipelineIa(capture.pipeline_ia),
  reviewSrs: {
    repetitions: capture.revision_srs?.repetitions || 0,
    intervalDays: capture.revision_srs?.intervalle_jours || 0,
    easeFactor: typeof capture.revision_srs?.facteur_aisance === 'number'
      ? capture.revision_srs.facteur_aisance
      : 2.5,
    nextReviewAt: capture.revision_srs?.prochaine_revision || null,
    lastReviewAt: capture.revision_srs?.derniere_revision || null,
  },
});

const construireQueryCaptures = filters => {
  const query = new URLSearchParams();

  if (filters?.tag) {
    query.set('tag', filters.tag);
  }
  if (filters?.formalite) {
    query.set('formalite', filters.formalite);
  }
  if (typeof filters?.latitude === 'number') {
    query.set('latitude', String(filters.latitude));
  }
  if (typeof filters?.longitude === 'number') {
    query.set('longitude', String(filters.longitude));
  }
  if (typeof filters?.rayonKm === 'number') {
    query.set('rayon_km', String(filters.rayonKm));
  }

  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
};

const normaliserStats = payload => ({
  totalCaptures: typeof payload?.total_captures === 'number' ? payload.total_captures : 0,
  totalReviewedPhrases:
    typeof payload?.total_phrases_revisees === 'number'
      ? payload.total_phrases_revisees
      : 0,
  totalDueRevisions:
    typeof payload?.total_revisions_dues === 'number' ? payload.total_revisions_dues : 0,
  totalScheduledRevisions:
    typeof payload?.total_revisions_a_venir === 'number' ? payload.total_revisions_a_venir : 0,
  topTags: Array.isArray(payload?.tags_dominants)
    ? payload.tags_dominants.map(item => ({
        tag: item?.tag || '',
        total: typeof item?.total === 'number' ? item.total : 0,
      }))
    : [],
  languageBreakdown: Array.isArray(payload?.repartition_langues)
    ? payload.repartition_langues.map(item => ({
        key: item?.cle || '',
        total: typeof item?.total === 'number' ? item.total : 0,
      }))
    : [],
  formalityBreakdown: Array.isArray(payload?.repartition_formalites)
    ? payload.repartition_formalites.map(item => ({
        key: item?.cle || '',
        total: typeof item?.total === 'number' ? item.total : 0,
      }))
    : [],
});

export const fetchCaptures = async filters => {
  const response = await fetch(
    `${BACKEND_BASE_URL}/captures${construireQueryCaptures(filters)}`,
  );
  if (!response.ok) {
    throw new Error(`Impossible de charger les captures (${response.status}).`);
  }

  const payload = await response.json();
  return Array.isArray(payload.captures)
    ? payload.captures.map(normaliserCapture)
    : [];
};

export const fetchBackendHealth = async () => {
  const response = await fetch(`${BACKEND_BASE_URL}/sante`);
  if (!response.ok) {
    throw new Error(`Impossible de verifier la sante du backend (${response.status}).`);
  }

  const payload = await response.json();
  return normaliserSanteBackend(payload);
};

export const fetchPreflight = async () => {
  const response = await fetch(`${BACKEND_BASE_URL}/preflight`);
  if (!response.ok) {
    throw new Error(`Impossible de verifier le preflight backend (${response.status}).`);
  }

  const payload = await response.json();
  return normaliserPreflight(payload);
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

export const fetchRevisionStats = async () => {
  const response = await fetch(`${BACKEND_BASE_URL}/stats`);
  if (!response.ok) {
    throw new Error(`Impossible de charger les statistiques (${response.status}).`);
  }

  const payload = await response.json();
  return normaliserStats(payload);
};

export const fetchDueRevisions = async () => {
  const response = await fetch(`${BACKEND_BASE_URL}/revisions/due`);
  if (!response.ok) {
    throw new Error(`Impossible de charger les revisions dues (${response.status}).`);
  }

  const payload = await response.json();
  return Array.isArray(payload.captures)
    ? payload.captures.map(normaliserCapture)
    : [];
};

export const submitCaptureReview = async (captureId, quality) => {
  const response = await fetch(`${BACKEND_BASE_URL}/captures/${captureId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({qualite: quality}),
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

export {
  BACKEND_BASE_URL,
  construireQueryCaptures,
  normaliserCapture,
  normaliserPipelineIa,
  normaliserPreflight,
  normaliserSanteBackend,
  normaliserStats,
};
