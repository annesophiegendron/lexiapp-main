# Backend Lexiapp

Backend FastAPI pour capturer, transcrire et analyser des phrases apprises en situation reelle avec IA locale.

## Prerequis

- Python 3.11+
- PostgreSQL via Docker Compose
- Ollama avec `llama3` si l'analyse locale doit etre activee
- Stockage audio `local` ou `supabase`
- Environ 8 Go de RAM pour Whisper + Ollama

## Installation

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Les valeurs par defaut de `.env` conviennent pour un usage local.

Si vous voulez envoyer les audios vers Supabase Storage, configurez aussi:

```dotenv
STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_BUCKET=captures-audio
SUPABASE_PUBLIC_BASE_URL=https://<project>.supabase.co/storage/v1/object/public/captures-audio
```

## Lancement

Demarrer PostgreSQL :

```bash
docker compose up -d postgres
```

Ou lancer toute la pile de production locale depuis la racine du projet :

```bash
docker compose up --build
```

Demarrer Ollama dans un second terminal si vous voulez l'analyse semantique :

```bash
ollama run llama3
```

Demarrer l'API :

```bash
python main.py
```

API disponible sur `http://localhost:8000`

## Endpoints disponibles

- `GET /` : points d'entree utiles
- `GET /sante` : sante backend, base de donnees et Ollama
- `GET /preflight` : verification detaillee des prerequis phase 2
- `GET /captures` : liste des captures
- `GET /captures/{capture_id}` : detail d'une capture
- `POST /captures` : upload audio + geolocalisation + langue
- `POST /captures/{capture_id}/review` : notation d'une revision avec calcul SM-2
- `GET /revisions/due` : liste des captures a reviser
- `GET /stats` : statistiques simples de revision et tags
- `GET /analytics` : statistiques avancees pour le dashboard et la gamification
- `GET /stockage/audios/{nom_fichier}` : acces aux audios stockes localement

Note: la route `GET /stockage/audios/{nom_fichier}` ne sert que le stockage `local`. Avec `supabase`, `audio_url` est deja une URL absolue vers le bucket.

Documentation interactive :

- Swagger UI : `http://localhost:8000/docs`
- ReDoc : `http://localhost:8000/redoc`

## Exemple de creation

```bash
curl -X POST http://localhost:8000/captures ^
  -F "audio=@test_voix.wav" ^
  -F "latitude=48.8566" ^
  -F "longitude=2.3522" ^
  -F "langue=fr"
```

## Variables d'environnement

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lexiapp
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT_SECONDS=180
WHISPER_MODEL=base
SEED_DEMO_DATA=false
AUDIO_STORAGE_DIR=backend/stockage/audios
STORAGE_BACKEND=local
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=captures-audio
SUPABASE_PUBLIC_BASE_URL=
```

Pour des tests locaux sans PostgreSQL :

```dotenv
DATABASE_URL=sqlite:///backend/test.db
```

## Tests

```bash
python -m pytest
```

## Verification preflight phase 2

```bash
python preflight_check.py
```

Ce script verifie rapidement les prerequis locaux utiles a la phase 2:

- paquets Python critiques (`psycopg`, `openai-whisper`, `httpx`, `fastapi`)
- disponibilite de `ffmpeg`
- accessibilite d'Ollama et presence du modele configure
- accessibilite TCP de PostgreSQL
- presence du dossier de stockage audio local ou configuration Supabase Storage

Interpretation:

- `degraded` : prerequis bloquants manquants pour la capture locale
- `warning` : capture et transcription possibles, mais analyse Ollama indisponible ou partielle
- `ok` : pipeline local complet disponible

## Phase 1 finalisee

- API FastAPI documentee
- Persistence PostgreSQL avec fallback SQLite pour les tests  (installé la version 16 de postgresql)
- Routes `GET /captures` et `POST /captures`
- Acces HTTP aux audios stockes localement
- Validation geolocalisation et type de fichier
- Stockage audio local
- Support du stockage audio local ou Supabase Storage
- Tests backend de base

## Phase 2: statut verifie

Les fondamentaux de la phase 2 sont deja implementes dans ce backend:

- Transcription locale Whisper configurable par `WHISPER_MODEL`
- Analyse locale Ollama avec degradation propre si indisponible
- Champ `formalite` et tags persistants dans PostgreSQL
- Stockage audio reutilisable pour le pipeline IA
- Route `GET /preflight` pour verifier rapidement l'environnement local

## Base prete pour la phase 3

- Objectif retenu: rendre visible l'etat du pipeline IA pour que le frontend sache si l'analyse locale a vraiment reussi ou si un fallback a ete applique
- Logique SRS de base branchee sur les captures deja stockees
- Introduire des filtres de recherche par contexte, lieu et vibe
- Exposer des statistiques simples via de nouvelles routes backend

## Phase 3 demarree

Le backend expose maintenant un premier flux de repetition espacee:

- chaque capture stocke un bloc `revision_srs`
- `POST /captures/{capture_id}/review` enregistre une note de revision (`qualite` de 0 a 5)
- `GET /revisions/due` retourne les captures dont `prochaine_revision` est echue

Exemple de payload de notation:

```json
{
  "qualite": 4
}
```

## Filtres backend phase 3

`GET /captures` reste compatible avec l'existant, mais accepte maintenant des filtres simples:

- `tag` pour filtrer sur un tag exact
- `formalite` pour filtrer sur `familier`, `standard` ou `soutenu`
- `latitude`, `longitude` et `rayon_km` pour restreindre les captures a une zone

Exemple:

```bash
curl "http://localhost:8000/captures?tag=voyage&formalite=standard&latitude=48.8566&longitude=2.3522&rayon_km=10"
```

## Stats phase 3

`GET /stats` retourne un resume simple de l'activite de revision:

- `total_captures`
- `total_phrases_revisees`
- `total_revisions_dues`
- `total_revisions_a_venir`
- `tags_dominants`
- `repartition_langues`
- `repartition_formalites`

## Analytics avancees

`GET /analytics` expose les signaux utilisees pour la suite de la gamification :

- `total_captures`
- `total_phrases_maitrisees`
- `taux_retenue`
- `total_revisions_dues`
- `total_revisions_a_venir`
- `streak_jours`
- `matrice_forces_faiblesses`

La matrice regroupe les tags les plus actifs et calcule un taux de reussite base sur l'etat SRS courant des captures.

## Reponses des captures

Les reponses `POST /captures`, `GET /captures` et `GET /captures/{capture_id}` exposent maintenant un bloc `pipeline_ia` pour que le frontend sache si l'analyse locale a reussi ou si un fallback a ete applique :

```json
{
  "status": "success",
  "message": "Le fichier audio recu a ete enregistre.",
  "capture": {
    "id": "uuid",
    "phrase_originale": "Bonjour",
    "traduction": "Hello",
    "audio_url": "/stockage/audios/fichier.wav",
    "contexte_tags": ["salutation"],
    "formalite": "standard",
    "geolocalisation": {
      "latitude": 48.8566,
      "longitude": 2.3522
    },
    "langue": "fr",
    "timestamp": "2026-05-04T12:00:00+00:00",
    "pipeline_ia": {
      "transcription": {
        "statut": "ok",
        "modele": "base",
        "detail": null
      },
      "analyse": {
        "statut": "ok",
        "modele": "llama3",
        "detail": null
      }
    }
  },
  "pipeline_ia": {
    "transcription": {
      "statut": "ok",
      "modele": "base",
      "detail": null
    },
    "analyse": {
      "statut": "ok",
      "modele": "llama3",
      "detail": null
    }
  }
}
```

Si Ollama est indisponible, `pipeline_ia.analyse.statut` vaut `fallback` et `pipeline_ia.analyse.detail` contient la cause du fallback. Le preflight remonte alors en `warning` plutot qu'en `degraded` pour ne pas bloquer l'upload de capture.

## Limites connues

- Pas encore de routes PUT ou delete
- Pas encore de flux mobile d'enregistrement audio branche au backend
- Pas encore de file de traitement asynchrone pour les traitements IA lourds
## ce fichier est une sorte de repere
