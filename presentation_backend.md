# Script de soutenance - Lexi-Context

Durée cible: environ 20 minutes.

Ce script suit uniquement le diaporama `LEXI-CONTEXT` et reste centré sur la partie backend.

## 1. Introduction

Bonjour, je vais vous présenter mon travail de stage à travers le projet Lexi-Context, un développement d’application d’apprentissage linguistique assistée par IA locale.

Je suis Aicha DABO, étudiante en BUT2C. J’ai réalisé ce travail dans le cadre d’un environnement freelance à Stockholm, en Suède, sous le tutorat entreprise d’Anne Sophie Gendron.

L’idée de cette présentation est simple: vous montrer le contexte du projet, la problématique, mes missions, les choix techniques, l’architecture mise en place, les réalisations principales, les difficultés rencontrées, puis les résultats et les perspectives.

## 2. Présentation de l’entreprise et du contexte

Le projet a été porté par Anne Sophie Gendron.

Le contexte est celui d’un développement en environnement freelance, avec un travail réalisé à Stockholm, en Suède. Cela signifie que j’ai dû avancer avec une forte autonomie, en structurant moi-même une base technique claire et exploitable.

Le projet Lexi-Context s’inscrit dans une logique d’apprentissage linguistique. L’objectif n’est pas seulement de stocker du vocabulaire, mais de construire une application capable de s’appuyer sur des phrases réelles, dans leur contexte d’usage.

## 3. Objectif du projet

L’objectif du projet est de créer une application capable:
- d’enregistrer des phrases réelles,
- de les analyser automatiquement,
- et de faciliter leur mémorisation.

Autrement dit, il ne s’agit pas d’une simple application de liste de mots. Le but est d’aider l’utilisateur à apprendre à partir de situations concrètes, avec une logique plus proche de la vraie utilisation de la langue.

## 4. Problématique

Le point de départ du projet repose sur plusieurs constats.

D’abord, l’apprentissage est souvent déconnecté du contexte réel. On apprend des mots ou des phrases, mais on ne les relie pas assez à une situation vécue.

Ensuite, il y a un oubli rapide des nouvelles expressions. Sans système de suivi, les phrases retenues au départ sont souvent perdues ensuite.

Enfin, il existe une dépendance aux services cloud. Dans beaucoup de solutions, les traitements reposent sur des services externes, ce qui pose des questions de coût, de disponibilité et d’autonomie.

La question posée dans le diaporama est donc la suivante:

Comment capturer, analyser et réutiliser efficacement des phrases entendues dans des situations réelles tout en restant autonome et sans API payantes?

## 5. Mes missions

Les tâches qui m’ont été confiées sont les suivantes:
- conception du backend,
- gestion de la base de données,
- intégration de Whisper,
- intégration d’Ollama,
- mise en place des APIs,
- développement de la logique SRS,
- tests et validation.

Cela représente le cœur de la partie technique du projet. Mon rôle était de poser une base backend solide, capable de soutenir l’application et ses évolutions.

## 6. Choix techniques

Les choix techniques ont été faits pour répondre à l’objectif d’autonomie et de robustesse.

J’ai retenu:
- FastAPI pour l’API,
- PostgreSQL pour la base de données,
- Whisper pour la transcription,
- Ollama pour l’analyse locale,
- et une logique SRS pour organiser la révision dans le temps.

Le choix de FastAPI permet de construire une API claire, rapide et facilement documentée.

Le choix de PostgreSQL permet de gérer des données structurées, avec une base plus fiable pour les captures, les métadonnées et les statistiques.

Whisper et Ollama répondent à l’objectif de traitement local, sans dépendre d’API payantes.

La logique SRS apporte une vraie valeur pédagogique, car elle permet de revoir les phrases au bon moment.

## 7. Architecture du système

L’architecture du système a été pensée pour séparer clairement les responsabilités.

Le backend est organisé autour de plusieurs briques:
- la couche API,
- la gestion des données,
- le stockage des médias,
- la transcription,
- l’analyse IA,
- et la logique de révision.

Cette séparation est importante parce qu’elle rend le projet plus lisible, plus testable, et plus simple à faire évoluer.

Dans cette architecture, chaque composant a son rôle:
- les routes exposent les fonctionnalités,
- la base de données conserve les informations,
- les fichiers audio sont gérés séparément,
- et les modules IA interviennent uniquement dans leur domaine.

## 8. Réalisations principales

Les réalisations principales de ma partie backend sont les suivantes.

J’ai d’abord mis en place une API fonctionnelle pour gérer les captures.

Ensuite, j’ai connecté une base PostgreSQL opérationnelle pour stocker les données de manière structurée.

J’ai intégré le pipeline IA avec Whisper pour la transcription et Ollama pour l’analyse locale.

J’ai aussi assuré la gestion des médias, notamment les fichiers audio.

Enfin, j’ai ajouté les tests automatisés pour valider le comportement du backend.

La réalisation la plus importante, à mes yeux, est que l’application ne repose pas uniquement sur une logique de stockage. Elle transforme une capture audio en donnée exploitable, analysée et réutilisable.

## 9. Difficultés rencontrées et solutions

Comme souvent dans un projet qui combine plusieurs technologies, j’ai rencontré plusieurs difficultés.

La première difficulté a été l’intégration de plusieurs technologies en même temps. Il fallait faire fonctionner ensemble l’API, la base de données, le stockage audio et les briques IA.

La deuxième difficulté concernait la structuration des données. Il fallait éviter un backend désorganisé, avec des champs mal définis ou difficiles à exploiter côté frontend.

La troisième difficulté concernait la gestion des fichiers audio. Un fichier audio mal géré peut bloquer toute la chaîne de traitement.

La quatrième difficulté concernait la qualité variable des réponses IA. Une IA locale peut parfois être indisponible ou renvoyer des résultats incomplets.

Les solutions apportées sont:
- une architecture modulaire,
- des tests d’intégration,
- une validation stricte des données,
- et une amélioration progressive des prompts.

L’idée était de rendre le système plus stable et plus prévisible, même dans les cas où une dépendance technique ne répond pas parfaitement.

## 10. Architecture du système, détail backend

Sur la partie backend, j’ai structuré les traitements de manière à couvrir le cycle complet de la donnée.

D’abord, la capture est enregistrée.

Ensuite, la donnée passe dans le pipeline de transcription et d’analyse.

Puis elle est stockée avec ses métadonnées.

Enfin, elle peut être réutilisée pour la révision et les statistiques.

Cette logique permet de relier directement l’usage réel au suivi pédagogique.

L’intérêt de cette architecture est aussi de garder le backend autonome. Si une brique IA tombe en panne, le système ne s’arrête pas totalement: il peut continuer à fonctionner avec un fallback ou un état dégradé.

## 11. Réalisations principales, mise en valeur

Si je devais résumer mes réalisations principales en une phrase, je dirais:

j’ai transformé un besoin d’apprentissage linguistique en une architecture backend complète, avec API, base de données, IA locale, stockage audio et logique de révision.

Concrètement, cela veut dire que j’ai apporté:
- une base technique exploitable,
- une structuration des données,
- un traitement IA local,
- et une logique de validation par tests.

## 12. Difficultés rencontrées et solutions, retour d’expérience

Cette partie m’a appris qu’un backend ne se limite pas à “faire fonctionner” une route.

Il faut aussi penser à:
- la robustesse,
- la lisibilité,
- l’autonomie,
- et la qualité des retours d’erreur.

Les tests d’intégration ont joué un rôle important, parce qu’ils m’ont permis de vérifier que les différents blocs du système pouvaient réellement travailler ensemble.

De la même façon, la validation des données évite d’envoyer au frontend des informations incohérentes ou incomplètes.

## 13. Résultats et bilan

Les résultats obtenus sont les suivants:
- une API fonctionnelle,
- une base PostgreSQL opérationnelle,
- un pipeline IA validé,
- une gestion des médias,
- et des tests automatisés.

Les compétences développées sont également importantes:
- utilisation du logiciel Ollama,
- travail avec PostgreSQL,
- conception d’une API,
- IA locale,
- et architecture logicielle.

Le bilan de ce travail est positif, car il m’a permis de découvrir un projet IA complet et de travailler sur une architecture moderne.

## 14. Conclusion et perspectives

Pour conclure, Lexi-Context m’a permis de travailler sur une application qui associe apprentissage linguistique, backend structuré et IA locale.

Le projet répond à une problématique réelle: apprendre des phrases en contexte, sans dépendre uniquement d’outils externes, et avec une logique de mémorisation plus intelligente.

Les perspectives possibles sont:
- la synchronisation hors ligne,
- la recherche vectorielle,
- les analytics utilisateur,
- et la dockerisation.

Enfin, sur le plan personnel, ce projet m’a fait monter en compétence sur FastAPI, Ollama et PostgreSQL, tout en me confrontant à un vrai travail d’architecture logicielle.

Merci.

