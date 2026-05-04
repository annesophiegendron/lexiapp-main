# Backend Lexiapp

Backend FastAPI pour capturer, transcrire et analyser des phrases apprises en situation reelle avec IA locale.

## Prerequis

- Python 3.11+
- PostgreSQL via Docker Compose
- Ollama avec `llama3` si l'analyse locale doit etre activee
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

## Lancement

Demarrer PostgreSQL :

```bash
docker compose up -d postgres
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
- `GET /captures` : liste des captures
- `GET /captures/{capture_id}` : detail d'une capture
- `POST /captures` : upload audio + geolocalisation + langue
- `GET /stockage/audios/{nom_fichier}` : acces aux audios stockes localement

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
WHISPER_MODEL=base
SEED_DEMO_DATA=false
AUDIO_STORAGE_DIR=backend/stockage/audios
```

Pour des tests locaux sans PostgreSQL :

```dotenv
DATABASE_URL=sqlite:///backend/test.db
```

## Tests

```bash
python -m unittest test_main.py
```

## Phase 1 finalisee

- API FastAPI documentee
- Persistence PostgreSQL avec fallback SQLite pour les tests
- Routes `GET /captures` et `POST /captures`
- Acces HTTP aux audios stockes localement
- Validation geolocalisation et type de fichier
- Stockage audio local
- Tests backend de base

## Base prete pour la phase 2

- Transcription locale Whisper configurable par `WHISPER_MODEL`
- Analyse locale Ollama avec degradation propre si indisponible
- Champ `formalite` et tags persistants dans PostgreSQL
- Stockage audio reutilisable pour le pipeline IA

## Limites connues

- Pas encore de routes `PUT` ou `DELETE`
- Pas encore de flux mobile d'enregistrement audio branche au backend
- Pas encore de file de traitement asynchrone pour les traitements IA lourds
