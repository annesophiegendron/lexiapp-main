# La Phase 1 du projet complète

Backend FastAPI pour capturer, transcrire et analyser des phrases apprises en situation réelle avec IA locale.



### Nécessaire pour la compilation du projet
- **Python 3.11+**
- **PostgreSQL** (via Docker Compose)
- **Ollama** avec Llama 3 (optionnel, fallback possible)
- **8 Go RAM minimum** pour Whisper + Ollama

### Installation

```bash
# 1. Naviguer dans le dossier backend
cd backend

# 2. Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env si nécessaire (valeurs par défaut OK pour local)
```

### Lancer l'Infrastructure

```bash
# Terminal 1: Démarrer PostgreSQL
docker-compose up -d

# Vérifier que PostgreSQL est actif
docker ps | grep lexiapp-postgres

# Terminal 2: Démarrer Ollama (optionnel mais recommandé)
ollama run llama3

# Terminal 3: Démarrer le serveur FastAPI
python main.py
```

Le serveur démarre sur `http://localhost:8000`

---

### Swagger/OpenAPI
Accéder à la documentation interactive :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

### Routes Disponibles

#### Santé du Système** (Check DB + Ollama)
```http
GET /sante
```
**Réponse (200 OK):**
```json
{
  "status": "ok",
  "message": "Le serveur est prêt.",
  "version": 2
}
```

#### Pour Lister Toutes les Captures**
```http
GET /captures
```
**Réponse:**
```json
{
  "total": 5,
  "captures": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phrase_originale": "Jag heter Anna",
      "traduction": "Je m'appelle Anna",
      "audio_url": "/stockage/audios/abc123.wav",
      "contexte_tags": ["voyage", "rencontre"],
      "formalite": "standard",
      "geolocalisation": { "latitude": 48.8566, "longitude": 2.3522 },
      "langue": "sv",
      "timestamp": "2026-04-28T10:30:45.123456"
    }
  ]
}
```

#### Pour **Récupérer Une Capture Spécifique**
```http
GET /captures/{capture_id}
```
**Exemple:**
```bash
curl http://localhost:8000/captures/550e8400-e29b-41d4-a716-446655440000
```

#### 4 **Créer une Capture** (POST multipart)
```http
POST /captures
Content-Type: multipart/form-data

- audio: <fichier.wav>
- latitude: 48.8566
- longitude: 2.3522
- langue: fr
```

**Réponse (200 OK):**
```json
{
  "status": "success",
  "message": "Le fichier audio recu a ete enregistre.",
  "capture": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phrase_originale": "Bonjour le monde",
    "traduction": "Hello world",
    "audio_url": "/stockage/audios/xyz789.wav",
    "contexte_tags": ["salutation", "test"],
    "formalite": "standard",
    "geolocalisation": { "latitude": 48.8566, "longitude": 2.3522 },
    "langue": "fr",
    "timestamp": "2026-04-28T10:35:12.654321"
  }
}
```

---

##  Tests avec Postman/cURL

### Tester la Santé
```bash
curl http://localhost:8000/sante
```

### Lister les Captures
```bash
curl http://localhost:8000/captures
```

### Créer une Capture avec Audio
```bash
curl -X POST http://localhost:8000/captures \
  -F "audio=@backend/test_voix.wav" \
  -F "latitude=48.8566" \
  -F "longitude=2.3522" \
  -F "langue=fr"
```

### Récupérer Une Capture
```bash
curl http://localhost:8000/captures/550e8400-e29b-41d4-a716-446655440000
```

---

### Erreurs Courantes

**400 Bad Request** - Latitude/Longitude invalides
```json
{
  "detail": "La latitude doit être entre -90 et 90"
}
```

**400 Bad Request** - Audio non valide
```json
{
  "detail": "Le fichier envoyé doit être un audio valide."
}
```

**500 Internal Server Error** - Transcription échouée
```json
{
  "detail": "Erreur lors de la transcription audio: [description]"
}
```

**503 Service Unavailable** - PostgreSQL indisponible
```json
{
  "detail": "Base de données PostgreSQL indisponible"
}
```

---

## La Configuration (.env)

```dotenv
# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lexiapp

# Ollama (IA locale)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Stockage audio
AUDIO_STORAGE_DIR=backend/stockage/audios
```

### Variables Alternatives

```dotenv
# SQLite (pour tests sans Docker)
DATABASE_URL=sqlite:///backend/test.db

# Ollama distant
OLLAMA_URL=http://192.168.1.100:11434

# Modèle plus rapide (pour mobile)
OLLAMA_MODEL=mistral
```

---

##  Architecture de la  base de Données

### Table `captures`
```sql
CREATE TABLE captures (
    id UUID PRIMARY KEY,
    phrase_originale TEXT NOT NULL,
    traduction TEXT,
    audio_url TEXT NOT NULL,
    contexte_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    formalite TEXT NOT NULL,  -- 'familier', 'standard', 'soutenu'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    langue VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## La Pipeline IA Complet

```
Audio (WAV/MP3) 
    ↓
[Whisper - Transcription locale]
    ↓
Texte brut (phrase_originale)
    ↓
[Ollama - Analyse LLM]
    ↓
JSON: {traduction, tags, formalite}
    ↓
[PostgreSQL - Persistance]
    ↓
Réponse API + Fichier audio stocké
```

### Exemple Pipeline Réel

1. **Upload audio:** "Jag heter Anna"
2. **Whisper transcrit:** "jag heter anna"
3. **Ollama analyse:**
   - `traduction`: "Je m'appelle Anna"
   - `tags`: ["rencontre", "présentation"]
   - `formalite`: "standard"
4. **Sauvegarde DB:** UUID généré, audio stocké localement
5. **Retour API:** Capture complète avec métadonnées

---

## Logging

Les logs sont configurés en console et affichent :
- Toutes les requêtes créées
- Étapes du pipeline (transcription, analyse)
- Erreurs et avertissements

**Exemple:**
```
2026-04-28 10:30:45 - main - INFO - Création capture: audio=test.wav, lat=48.8566, lon=2.3522, langue=fr
2026-04-28 10:30:47 - main - INFO - Transcription réussie: jag heter anna...
2026-04-28 10:30:50 - main - INFO - Analyse réussie - tags: ['rencontre', 'présentation']
2026-04-28 10:30:51 - main - INFO - Capture créée avec succès: 550e8400-e29b-41d4-a716-446655440000
```

---

## Dépannage

### PostgreSQL ne démarre pas
```bash
docker logs lexiapp-postgres
docker-compose restart postgres
```

### Ollama indisponible mais je veux continuer
```bash
# Les captures seront créées sans traduction/tags/formalité
# Vérifier les logs dans /main.py
```

### Whisper lent au premier démarrage
C'est normal ! Le modèle (500 MB) est téléchargé et cachée lors du premier lancement.

### Base de données pleine
```bash
# Vider la table captures
psql postgresql://postgres:postgres@localhost:5432/lexiapp
DROP TABLE captures;
# Puis relancer le serveur (la table sera recréée)
```

---

##  Checklist Phase 1 Complète

- Serveur FastAPI avec routes CRUD
-  PostgreSQL + SQLite support
-  Whisper transcription locale
-  Ollama analyse LLM
-  Gestion d'erreurs robuste
-  Logging structuré
-  CORS configuration
-  Validation géolocalisation
-  Tests unitaires
-  Documentation Swagger/OpenAPI
-  README complet

---

##  Prochaines Étapes (Phase 2-3)

- [ ] Implémenter algorithme SRS (Spaced Repetition)
- [ ] Recherche sémantique par tags/lieu
- [ ] Statistiques (phrases maîtrisées, thématiques)
- [ ] Routes DELETE/PUT pour gestion captures
- [ ] Intégration avec frontend React Native

---

## 📞 Support

Pour des questions ou problèmes, vérifier d'abord :
1. Les logs du serveur (`python main.py`)
2. La santé du système (`GET /sante`)
3. La documentation Swagger (`/docs`)
