# Lexiapp

Projet mobile avec un frontend React et un backend FastAPI.

## Backend

Le backend se trouve dans `backend/`.

### Etat actuel

- contrat d'API defini avec FastAPI
- persistence SQLite pour les captures
- routes disponibles pour la sante et les captures
- schema SQL aligne avec la base locale

### Fichiers utiles

- `backend/main.py` : API FastAPI
- `backend/database.py` : acces SQLite
- `backend/models.py` : modeles Pydantic du contrat d'API
- `backend/schema.sql` : schema SQLite de reference
- `backend/requirements.txt` : dependances Python

### Lancer le backend

Depuis `backend/` :

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Le fichier SQLite est cree automatiquement dans `backend/lexiapp.db`.

Puis ouvrir :

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/sante`

### Lancer les tests backend

Depuis `backend/` :

```bash
python -m unittest test_main.py
```

## Frontend

Le frontend React Native reste lance depuis la racine du projet avec les commandes habituelles `npm` ou `yarn` si possible.
