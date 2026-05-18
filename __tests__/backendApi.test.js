import {
  normaliserCapture,
  normaliserPreflight,
  normaliserSanteBackend,
} from '../services/backendApi';

describe('backendApi normalizers', () => {
  it('normalise la capture backend avec pipeline IA', () => {
    const capture = normaliserCapture({
      id: 'abc',
      phrase_originale: 'bonjour',
      traduction: 'hello',
      audio_url: '/stockage/audios/test.wav',
      contexte_tags: ['salutation'],
      formalite: 'standard',
      geolocalisation: {
        latitude: 48.85,
        longitude: 2.35,
      },
      langue: 'fr',
      timestamp: '2026-05-12T10:00:00Z',
      pipeline_ia: {
        transcription: {statut: 'ok', modele: 'base', detail: null},
        analyse: {statut: 'fallback', modele: 'llama3', detail: 'ollama indisponible'},
      },
    });

    expect(capture.original).toBe('bonjour');
    expect(capture.translation).toBe('hello');
    expect(capture.pipelineIa.transcription.modele).toBe('base');
    expect(capture.pipelineIa.analyse.statut).toBe('fallback');
    expect(capture.pipelineIa.analyse.detail).toBe('ollama indisponible');
  });

  it('conserve une URL audio absolue pour Supabase Storage', () => {
    const capture = normaliserCapture({
      id: 'def',
      phrase_originale: 'hej',
      traduction: 'hi',
      audio_url: 'https://demo.supabase.co/storage/v1/object/public/captures-audio/audios/test.m4a',
      contexte_tags: [],
      formalite: 'standard',
      geolocalisation: {
        latitude: 59.33,
        longitude: 18.06,
      },
    });

    expect(capture.audioUrl).toBe(
      'https://demo.supabase.co/storage/v1/object/public/captures-audio/audios/test.m4a',
    );
  });

  it('normalise un payload preflight incomplet', () => {
    const preflight = normaliserPreflight({
      status: 'warning',
      checks: [{sujet: 'ffmpeg'}],
    });

    expect(preflight.status).toBe('warning');
    expect(preflight.checks[0].statut).toBe('INCONNU');
    expect(preflight.checks[0].sujet).toBe('ffmpeg');
  });

  it('normalise la sante backend avec valeurs par defaut', () => {
    const health = normaliserSanteBackend({});

    expect(health.status).toBe('indisponible');
    expect(health.message).toBe('Backend indisponible.');
    expect(health.version).toBeNull();
  });
});
