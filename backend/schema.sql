CREATE TABLE captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_originale TEXT NOT NULL,
    traduction TEXT,
    audio_url TEXT,
    contexte_tags TEXT[],
    formalite VARCHAR(50),
    latitude FLOAT,
    longitude FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP );
    