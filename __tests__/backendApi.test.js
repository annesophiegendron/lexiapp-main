import {
  construireQueryCaptures,
  normaliserCapture,
  normaliserPreflight,
  normaliserSanteBackend,
  normaliserStats,
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
    expect(capture.reviewSrs.repetitions).toBe(0);
    expect(capture.reviewSrs.nextReviewAt).toBeNull();
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

  it('construit une query string de filtres phase 3', () => {
    expect(
      construireQueryCaptures({
        tag: 'voyage',
        formalite: 'standard',
        latitude: 48.8566,
        longitude: 2.3522,
        rayonKm: 8,
      }),
    ).toBe('?tag=voyage&formalite=standard&latitude=48.8566&longitude=2.3522&rayon_km=8');
  });

  it('normalise les statistiques de revision', () => {
    const stats = normaliserStats({
      total_captures: 12,
      total_phrases_revisees: 5,
      total_revisions_dues: 3,
      total_revisions_a_venir: 7,
      tags_dominants: [{tag: 'voyage', total: 4}],
      repartition_langues: [{cle: 'fr', total: 6}],
      repartition_formalites: [{cle: 'standard', total: 8}],
    });

    expect(stats.totalCaptures).toBe(12);
    expect(stats.totalReviewedPhrases).toBe(5);
    expect(stats.totalDueRevisions).toBe(3);
    expect(stats.totalScheduledRevisions).toBe(7);
    expect(stats.topTags[0].tag).toBe('voyage');
    expect(stats.languageBreakdown[0].key).toBe('fr');
    expect(stats.formalityBreakdown[0].key).toBe('standard');
  });
});
