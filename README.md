# Lexiapp

Projet mobile avec un frontend React  et un backend FastAPI encore en phase de mock.

## Backend

Le backend se trouve dans `backend/`.

### Etat actuel

- contrat d'API defini avec FastAPI
- routes mock disponibles pour la sante et les captures
- schema SQL initial pour la table `captures`

### Fichiers utiles

- `backend/main.py` : squelette de l'API
- `backend/schema.sql` : premier schema SQL
- `backend/requirements.txt` : dependances Python

### Lancer le backend

Depuis `backend/` :

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Puis ouvrir :

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/sante`

## Frontend

Le frontend React Native reste lance depuis la racine du projet avec les commandes habituelles `npm` ou `yarn` si possible.
