# Lexiapp

Projet mobile avec un frontend React et un backend FastAPI.

## Backend

Le backend se trouve dans `backend/`.

### Etat actuel

- contrat d'API defini avec FastAPI
- persistence PostgreSQL pour les captures
- routes disponibles pour la sante et les captures
- pipeline local Whisper + Ollama pour enrichir les captures

### Fichiers utiles

- `backend/main.py` : API FastAPI
- `backend/database.py` : acces base de donnees
- `backend/models.py` : modeles Pydantic du contrat d'API
- `backend/schema.sql` : schema PostgreSQL de reference
- `backend/docker-compose.yml` : PostgreSQL local via Docker
- `backend/requirements.txt` : dependances Python

### Lancer le backend

Depuis `backend/` :

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Puis creer `backend/.env` a partir de `backend/.env.example`, demarrer PostgreSQL local et lancer `ollama run llama3`.

### Demarrer PostgreSQL local

Depuis `backend/` :

```bash
docker compose up -d postgres
```

La base ecoute ensuite sur `localhost:5432` avec :

- base : `lexiapp`
- utilisateur : `postgres`
- mot de passe : `postgres`

### Commande finale backend

Depuis `backend/` avec l'environnement Python valide du projet :

```bash
venv311\Scripts\python.exe -m uvicorn main:app --reload
```

Puis ouvrir :

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/sante`

### Lancer les tests backend

Depuis `backend/` :

```bash
venv311\Scripts\python.exe -m unittest test_main.py
```

## Frontend

Le frontend React Native reste lance depuis la racine du projet avec les commandes habituelles `npm` ou `yarn` si possible.
