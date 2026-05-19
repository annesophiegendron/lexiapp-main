# Phase 3 - Fondamentaux

Ce fichier sert de repere pour demarrer la phase 3 

## Etat de depart

La phase 2 est deja couverte sur la plupart des bases utiles:

- transcription locale via Whisper
- analyse locale via Ollama
- stockage audio local ou dans un Supabase
- persistance des tags et du niveau de formalite

Cela suffit pour commencer la logique metier de revision.

## Ce qui est demarre ici

- une brique SRS minimale a ete ajoutee dans `backend/phase3.py`
- l'algorithme est volontairement isole du reste du backend
- aucune route API phase 3 n'est encore exposee

## Etapes recommandees

1. Etendre le schema `captures` ou creer une table `revisions` pour stocker:
   - `repetitions`
   - `intervalle_jours`
   - `facteur_aisance`
   - `prochaine_revision`
   - `derniere_revision`
2. Ajouter une route pour noter une phrase apres revision, par exemple `POST /captures/{id}/review`.
3. Ajouter une route pour recuperer les phrases dues, par exemple `GET /revisions/due`.
4. Ajouter des filtres backend sur les captures:
   - par tag
   - par zone ou lieu
   - par formalite
5. Ajouter une premiere route de stats:
   - nombre de captures
   - nombre de phrases revisees
   - repartition des tags dominants

## Ordre de travail conseille

- commencer par le stockage des donnees SRS
- brancher ensuite le calcul SM-2
- exposer seulement apres cela les routes de revision
- garder la recherche semantique avancee pour apres les filtres simples

## Point d'attention

La vraie "recherche par vibe" demandera sans doute plus tard soit:

- une taxonomie simple basee sur `contexte_tags`
- soit des embeddings et une recherche vectorielle

Pour l'instant, rester sur des filtres explicites est plus propre.
