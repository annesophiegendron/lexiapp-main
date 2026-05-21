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
- l'algorithme est maintenant branche au stockage des captures
- une premiere route API de notation est exposee: `POST /captures/{id}/review`
- une premiere route API de consultation est exposee: `GET /revisions/due`

## Etapes recommandees

1. Ajouter des filtres backend sur les captures:
   - par tag
   - par zone ou lieu
   - par formalite
2. Ajouter une premiere route de stats:
   - nombre de captures
   - nombre de phrases revisees
   - repartition des tags dominants

## Ordre de travail conseille

- garder le stockage SRS dans `captures` tant que le besoin reste simple
- enrichir ensuite les filtres et les stats avant toute recherche semantique avancee
- garder la recherche semantique avancee pour apres les filtres simples

## Point d'attention

La vraie "recherche par vibe" demandera sans doute plus tard soit:

- une taxonomie simple basee sur `contexte_tags`
- soit des embeddings et une recherche vectorielle

Pour l'instant, rester sur des filtres explicites est plus propre.
