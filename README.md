# Lexi-Context

Application mobile React Native avec backend FastAPI pour capturer, analyser et revoir des phrases apprises en situation reelle.

## Architecture

- **Frontend** : React Native
- **Backend** : FastAPI
- **Base de donnees** : PostgreSQL
- **IA locale** : Whisper pour la transcription et Ollama pour l'analyse
- **Repetitions espacees** : SM-2 cote backend

## Fonctionnalites backend

- capture audio avec geolocalisation
- transcription locale
- analyse IA locale avec fallback propre
- revision SRS et captures dues
- statistiques de base via `/stats`
- analytics avancees via `/analytics`
- service audio local expose via HTTP

## Lancer le projet en local

Depuis la racine du projet :

```bash
docker compose up --build
```

Cela lance :

- PostgreSQL
- Ollama
- le backend FastAPI

Le backend sera disponible sur `http://localhost:8000` et la documentation Swagger sur `http://localhost:8000/docs`.

## Tests

Backend :

```bash
cd backend
python -m pytest
```

Frontend :

```bash
npm test
```

## Endpoints principaux

- `GET /sante`
- `GET /preflight`
- `GET /captures`
- `GET /captures/{capture_id}`
- `POST /captures`
- `POST /captures/{capture_id}/review`
- `GET /revisions/due`
- `GET /stats`
- `GET /analytics`

## Documentation backend

La documentation detaillee du backend se trouve dans `backend/README.md`.
