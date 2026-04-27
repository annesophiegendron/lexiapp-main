CREATE TABLE IF NOT EXISTS captures (
    id UUID PRIMARY KEY,
    phrase_originale TEXT NOT NULL,
    traduction TEXT,
    audio_url TEXT NOT NULL,
    contexte_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    formalite TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    langue VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
