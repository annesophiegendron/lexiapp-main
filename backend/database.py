import json
import re
import uuid
import unicodedata
from collections import Counter
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any, Iterable, List, Optional, Sequence

try:
    from backend.config import DATABASE_URL
    from backend.models import Capture, CommandeCreationCapture, EtatRevision, Geolocalisation, PipelineIA, StatRepartition, StatTag, StatutEtapeIA
    from backend.phase3 import EtatSRS, calculer_revision_sm2
except ModuleNotFoundError:
    from config import DATABASE_URL
    from models import Capture, CommandeCreationCapture, EtatRevision, Geolocalisation, PipelineIA, StatRepartition, StatTag, StatutEtapeIA
    from phase3 import EtatSRS, calculer_revision_sm2

MAITRISE_MIN_REPETITIONS = 3
PSYCOPG_CONNECT_TIMEOUT_SECONDS = 5
EMBEDDING_DIMENSION = 16
CONCEPTES_SEMANTIQUES = [
    "nourriture",
    "boisson",
    "commande",
    "politesse",
    "transport",
    "logement",
    "direction",
    "temps",
    "argent",
    "travail",
    "rencontre",
    "urgence",
    "sante",
    "shopping",
    "sortie",
    "administratif",
]

LEXIQUE_CONCEPTES = {
    "manger": {"nourriture"},
    "repas": {"nourriture"},
    "restaurant": {"nourriture"},
    "menu": {"nourriture"},
    "cafe": {"boisson", "nourriture"},
    "cafes": {"boisson", "nourriture"},
    "croissant": {"nourriture"},
    "pain": {"nourriture"},
    "boire": {"boisson"},
    "boisson": {"boisson"},
    "eau": {"boisson"},
    "commander": {"commande"},
    "voudrais": {"commande", "politesse"},
    "souhaite": {"commande", "politesse"},
    "s'il": {"politesse"},
    "vous": {"politesse"},
    "plait": {"politesse"},
    "merci": {"politesse"},
    "bonjour": {"rencontre", "politesse"},
    "salut": {"rencontre", "politesse"},
    "train": {"transport"},
    "bus": {"transport"},
    "avion": {"transport"},
    "taxi": {"transport"},
    "metro": {"transport"},
    "hotel": {"logement"},
    "chambre": {"logement"},
    "reservation": {"logement", "administratif"},
    "reserver": {"logement", "administratif"},
    "adresse": {"direction", "administratif"},
    "ou": {"direction"},
    "gauche": {"direction"},
    "droite": {"direction"},
    "heure": {"temps"},
    "matin": {"temps"},
    "soir": {"temps"},
    "argent": {"argent"},
    "prix": {"argent", "shopping"},
    "payer": {"argent", "shopping"},
    "travail": {"travail"},
    "reunion": {"travail", "rencontre"},
    "urgent": {"urgence"},
    "urgence": {"urgence"},
    "medecin": {"sante"},
    "hopital": {"sante"},
    "pharmacie": {"sante"},
    "acheter": {"shopping"},
    "magasin": {"shopping"},
    "sortir": {"sortie"},
    "sortie": {"sortie"},
    "formulaire": {"administratif"},
    "document": {"administratif"},
}


# Schema PostgreSQL 
SCHEMA_POSTGRES = """
CREATE TABLE IF NOT EXISTS captures (
    id UUID PRIMARY KEY,
    phrase_originale TEXT NOT NULL,
    traduction TEXT,
    audio_url TEXT NOT NULL,
    contexte_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    formalite TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    langue VARCHAR(10),
    transcription_statut TEXT NOT NULL DEFAULT 'ok',
    transcription_modele TEXT,
    transcription_detail TEXT,
    analyse_statut TEXT NOT NULL DEFAULT 'ok',
    analyse_modele TEXT,
    analyse_detail TEXT,
    embedding JSONB NOT NULL DEFAULT '{}'::jsonb,
    repetitions INTEGER NOT NULL DEFAULT 0,
    intervalle_jours INTEGER NOT NULL DEFAULT 0,
    facteur_aisance DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    prochaine_revision TIMESTAMPTZ,
    derniere_revision TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""

# Schema SQLite pour les tests
SCHEMA_SQLITE = """
CREATE TABLE IF NOT EXISTS captures (
    id TEXT PRIMARY KEY,
    phrase_originale TEXT NOT NULL,
    traduction TEXT,
    audio_url TEXT NOT NULL,
    contexte_tags TEXT NOT NULL,
    formalite TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    langue TEXT,
    transcription_statut TEXT NOT NULL DEFAULT 'ok',
    transcription_modele TEXT,
    transcription_detail TEXT,
    analyse_statut TEXT NOT NULL DEFAULT 'ok',
    analyse_modele TEXT,
    analyse_detail TEXT,
    embedding TEXT NOT NULL DEFAULT '{}',
    repetitions INTEGER NOT NULL DEFAULT 0,
    intervalle_jours INTEGER NOT NULL DEFAULT 0,
    facteur_aisance REAL NOT NULL DEFAULT 2.5,
    prochaine_revision TEXT,
    derniere_revision TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
"""


def connecter_base(database_url: Optional[str] = None):
    # Bascule automatiquement entre SQLite pour les tests et PostgreSQL en execution normale.
    url = database_url or DATABASE_URL
    if url.startswith("sqlite:///"):
        import sqlite3

        chemin = Path(url.replace("sqlite:///", "", 1))
        chemin.parent.mkdir(parents=True, exist_ok=True)
        connexion = sqlite3.connect(chemin)
        connexion.row_factory = sqlite3.Row
        return connexion

    import psycopg

    return psycopg.connect(
        url,
        row_factory=psycopg.rows.dict_row,
        connect_timeout=PSYCOPG_CONNECT_TIMEOUT_SECONDS,
    )


def preparer_tags_pour_stockage(tags: List[str], database_url: str):
    # Adapte les tags au type attendu par le driver SQL cible.
    if database_url.startswith("sqlite:///"):
        return json.dumps(tags, ensure_ascii=True)

    from psycopg.types.json import Jsonb

    return Jsonb(tags)


def preparer_embedding_pour_stockage(vecteur: List[float], database_url: str):
    payload = {"source": "local_semantic", "values": vecteur}
    if database_url.startswith("sqlite:///"):
        return json.dumps(payload, ensure_ascii=True)

    from psycopg.types.json import Jsonb

    return Jsonb(payload)


def lire_embedding_stocke(valeur: Any) -> Optional[List[float]]:
    if valeur is None:
        return None
    if isinstance(valeur, dict):
        valeurs = valeur.get("values")
    elif isinstance(valeur, str):
        try:
            valeurs = json.loads(valeur).get("values")
        except Exception:
            return None
    else:
        valeurs = valeur

    if not isinstance(valeurs, list):
        return None

    vecteur: List[float] = []
    for element in valeurs:
        try:
            vecteur.append(float(element))
        except (TypeError, ValueError):
            return None
    return vecteur


def normaliser_texte_semantique(texte: str) -> List[str]:
    if not texte:
        return []

    texte_normalise = unicodedata.normalize("NFKD", texte)
    texte_normalise = "".join(
        caractere for caractere in texte_normalise if not unicodedata.combining(caractere)
    ).lower()
    mots = re.findall(r"[a-z0-9']+", texte_normalise)
    return [mot.strip("'") for mot in mots if mot.strip("'")]


def generer_embedding_texte(texte: str) -> List[float]:
    vecteur = [0.0] * EMBEDDING_DIMENSION
    if not texte:
        return vecteur

    mots = normaliser_texte_semantique(texte)
    for mot in mots:
        concepts = LEXIQUE_CONCEPTES.get(mot)
        if not concepts:
            continue
        for concept in concepts:
            index = CONCEPTES_SEMANTIQUES.index(concept)
            vecteur[index] += 1.0

    if any(vecteur):
        norme = sqrt(sum(valeur * valeur for valeur in vecteur))
        if norme > 0:
            return [round(valeur / norme, 6) for valeur in vecteur]

    # Repli lexical minimal pour les textes hors dictionnaire.
    for mot in mots:
        index = sum(ord(caractere) for caractere in mot) % EMBEDDING_DIMENSION
        vecteur[index] += 1.0

    norme = sqrt(sum(valeur * valeur for valeur in vecteur))
    if norme <= 0:
        return vecteur
    return [round(valeur / norme, 6) for valeur in vecteur]


def similarite_cosinus(vecteur_a: Sequence[float], vecteur_b: Sequence[float]) -> float:
    if not vecteur_a or not vecteur_b or len(vecteur_a) != len(vecteur_b):
        return 0.0

    produit_scalaire = sum(a * b for a, b in zip(vecteur_a, vecteur_b))
    norme_a = sqrt(sum(a * a for a in vecteur_a))
    norme_b = sqrt(sum(b * b for b in vecteur_b))
    if norme_a <= 0 or norme_b <= 0:
        return 0.0
    return produit_scalaire / (norme_a * norme_b)


def adapter_requete(requete: str, database_url: str) -> str:
    # Uniformise les placeholders SQL entre SQLite (?) et PostgreSQL (%s).
    if database_url.startswith("sqlite:///"):
        return requete
    return requete.replace("?", "%s")


def initialiser_base(database_url: Optional[str] = None) -> None:
    # Cree la table captures si elle n'existe pas encore.
    url = database_url or DATABASE_URL
    schema = SCHEMA_SQLITE if url.startswith("sqlite:///") else SCHEMA_POSTGRES
    with connecter_base(url) as connexion:
        connexion.execute(schema)
        garantir_colonnes_pipeline_ia(connexion, url)
        garantir_colonnes_phase3(connexion, url)
        garantir_colonnes_semantiques(connexion, url)
        connexion.commit()


def garantir_colonnes_pipeline_ia(connexion, database_url: str) -> None:
    colonnes = [
        ("transcription_statut", "TEXT NOT NULL DEFAULT 'ok'"),
        ("transcription_modele", "TEXT"),
        ("transcription_detail", "TEXT"),
        ("analyse_statut", "TEXT NOT NULL DEFAULT 'ok'"),
        ("analyse_modele", "TEXT"),
        ("analyse_detail", "TEXT"),
    ]

    if database_url.startswith("sqlite:///"):
        colonnes_existantes = {
            ligne["name"]
            for ligne in connexion.execute("PRAGMA table_info(captures)").fetchall()
        }
        for nom, definition in colonnes:
            if nom not in colonnes_existantes:
                connexion.execute(f"ALTER TABLE captures ADD COLUMN {nom} {definition}")
        return

    for nom, definition in colonnes:
        connexion.execute(f"ALTER TABLE captures ADD COLUMN IF NOT EXISTS {nom} {definition}")


def garantir_colonnes_phase3(connexion, database_url: str) -> None:
    colonnes = [
        ("repetitions", "INTEGER NOT NULL DEFAULT 0"),
        ("intervalle_jours", "INTEGER NOT NULL DEFAULT 0"),
        ("facteur_aisance", "REAL NOT NULL DEFAULT 2.5"),
        ("prochaine_revision", "TEXT"),
        ("derniere_revision", "TEXT"),
    ]

    if database_url.startswith("sqlite:///"):
        colonnes_existantes = {
            ligne["name"]
            for ligne in connexion.execute("PRAGMA table_info(captures)").fetchall()
        }
        for nom, definition in colonnes:
            if nom not in colonnes_existantes:
                connexion.execute(f"ALTER TABLE captures ADD COLUMN {nom} {definition}")
        return

    definitions_postgres = {
        "repetitions": "INTEGER NOT NULL DEFAULT 0",
        "intervalle_jours": "INTEGER NOT NULL DEFAULT 0",
        "facteur_aisance": "DOUBLE PRECISION NOT NULL DEFAULT 2.5",
        "prochaine_revision": "TIMESTAMPTZ",
        "derniere_revision": "TIMESTAMPTZ",
    }
    for nom, _definition in colonnes:
        connexion.execute(
            f"ALTER TABLE captures ADD COLUMN IF NOT EXISTS {nom} {definitions_postgres[nom]}"
        )


def garantir_colonnes_semantiques(connexion, database_url: str) -> None:
    colonnes = [
        ("embedding", "TEXT NOT NULL DEFAULT '{}'"),
    ]

    if database_url.startswith("sqlite:///"):
        colonnes_existantes = {
            ligne["name"]
            for ligne in connexion.execute("PRAGMA table_info(captures)").fetchall()
        }
        for nom, definition in colonnes:
            if nom not in colonnes_existantes:
                try:
                    connexion.execute(f"ALTER TABLE captures ADD COLUMN {nom} {definition}")
                except Exception as exc:
                    if "duplicate column name" not in str(exc).lower():
                        raise
        return

    for nom, definition in colonnes:
        connexion.execute(f"ALTER TABLE captures ADD COLUMN IF NOT EXISTS {nom} {definition}")

def lister_captures(
    database_url: Optional[str] = None,
    tag: Optional[str] = None,
    formalite: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    rayon_km: Optional[float] = None,
) -> List[Capture]:
    # Lit les captures les plus recentes pour alimenter l'app mobile.
    url = database_url or DATABASE_URL
    requete = adapter_requete(
        """
        SELECT
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision,
            created_at
        FROM captures
        ORDER BY created_at DESC, id DESC
        """,
        url,
    )

    with connecter_base(url) as connexion:
        lignes = connexion.execute(requete).fetchall()

    captures = [ligne_vers_capture(ligne) for ligne in lignes]
    return filtrer_captures(
        captures,
        tag=tag,
        formalite=formalite,
        latitude=latitude,
        longitude=longitude,
        rayon_km=rayon_km,
    )


def creer_capture(commande: CommandeCreationCapture, database_url: Optional[str] = None) -> Capture:
    # Enregistre une capture complete pour la renvoyer dans l'api
    url = database_url or DATABASE_URL
    identifiant = str(uuid.uuid4())
    tags = preparer_tags_pour_stockage(commande.contexte_tags, url)
    vecteur_embedding = generer_embedding_texte(
        " ".join(
            texte
            for texte in [commande.phrase_originale, commande.traduction or ""]
            if texte
        )
    )
    embedding = preparer_embedding_pour_stockage(vecteur_embedding, url)

    requete_insertion = adapter_requete(
        """
        INSERT INTO captures (
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        url,
    )
    requete_lecture = adapter_requete(
        """
        SELECT
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision,
            created_at
        FROM captures
        WHERE id = ?
        """,
        url,
    )

    params = [
        identifiant,
        commande.phrase_originale,
        commande.traduction,
        commande.audio_url,
        tags,
        commande.formalite,
        commande.latitude,
        commande.longitude,
        commande.langue,
        commande.pipeline_ia.transcription.statut if commande.pipeline_ia else "ok",
        commande.pipeline_ia.transcription.modele if commande.pipeline_ia else None,
        commande.pipeline_ia.transcription.detail if commande.pipeline_ia else None,
        commande.pipeline_ia.analyse.statut if commande.pipeline_ia else "ok",
        commande.pipeline_ia.analyse.modele if commande.pipeline_ia else None,
        commande.pipeline_ia.analyse.detail if commande.pipeline_ia else None,
        embedding,
        0,
        0,
        2.5,
        None,
        None,
    ]

    with connecter_base(url) as connexion:
        connexion.execute(requete_insertion, params)
        ligne = connexion.execute(requete_lecture, [identifiant]).fetchone()
        connexion.commit()

    return ligne_vers_capture(ligne)


def alimenter_donnees_demo(database_url: Optional[str] = None) -> None:
    # Ajoute une capture de demo uniquement si la base est vide.
    url = database_url or DATABASE_URL
    requete_total = adapter_requete("SELECT COUNT(*) FROM captures", url)
    requete_insertion = adapter_requete(
        """
        INSERT INTO captures (
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        url,
    )

    with connecter_base(url) as connexion:
        total = lire_premiere_valeur(connexion.execute(requete_total).fetchone())
        if total:
            return

        tags = preparer_tags_pour_stockage(["voyage", "situation-reelle"], url)
        connexion.execute(
            requete_insertion,
            [
                "00000000-0000-0000-0000-000000000001",
                "texte transcrit par l'ia",
                "exemple de traduction",
                "/stockage/audios/exemple.wav",
                tags,
                "standard",
                48.8566,
                2.3522,
                "fr",
                "ok",
                "base",
                None,
                "ok",
                "llama3",
                None,
                preparer_embedding_pour_stockage(
                    generer_embedding_texte("texte transcrit par l'ia exemple de traduction"),
                    url,
                ),
                0,
                0,
                2.5,
                None,
                None,
            ],
        )
        connexion.commit()


def ligne_vers_capture(ligne: Any) -> Capture:
    # Convertit une ligne SQL en modele Pydantic stable pour l'API.
    tags = ligne["contexte_tags"]
    if isinstance(tags, str):
        tags = json.loads(tags)

    timestamp = ligne["created_at"]
    if timestamp is not None and not isinstance(timestamp, str):
        timestamp = timestamp.isoformat()

    prochaine_revision = convertir_datetime_vers_iso(ligne["prochaine_revision"])
    derniere_revision = convertir_datetime_vers_iso(ligne["derniere_revision"])

    return Capture(
        id=str(ligne["id"]),
        phrase_originale=ligne["phrase_originale"],
        traduction=ligne["traduction"],
        audio_url=ligne["audio_url"],
        contexte_tags=tags,
        formalite=ligne["formalite"],
        geolocalisation=Geolocalisation(
            latitude=ligne["latitude"],
            longitude=ligne["longitude"],
        ),
        langue=ligne["langue"],
        timestamp=timestamp,
        pipeline_ia=PipelineIA(
            transcription=StatutEtapeIA(
                statut=ligne["transcription_statut"],
                modele=ligne["transcription_modele"],
                detail=ligne["transcription_detail"],
            ),
            analyse=StatutEtapeIA(
                statut=ligne["analyse_statut"],
                modele=ligne["analyse_modele"],
                detail=ligne["analyse_detail"],
            ),
        ),
        revision_srs=EtatRevision(
            repetitions=ligne["repetitions"],
            intervalle_jours=ligne["intervalle_jours"],
            facteur_aisance=ligne["facteur_aisance"],
            prochaine_revision=prochaine_revision,
            derniere_revision=derniere_revision,
        ),
    )


def lire_capture_par_id(identifiant: str, database_url: Optional[str] = None) -> Optional[Capture]:
    # Lit une capture specifique par son UUID.
    url = database_url or DATABASE_URL
    requete = adapter_requete(
        """
        SELECT
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision,
            created_at
        FROM captures
        WHERE id = ?
        """,
        url,
    )

    with connecter_base(url) as connexion:
        ligne = connexion.execute(requete, [identifiant]).fetchone()

    if not ligne:
        return None

    return ligne_vers_capture(ligne)


def noter_revision_capture(
    identifiant: str,
    qualite: int,
    database_url: Optional[str] = None,
    maintenant: Optional[datetime] = None,
) -> Optional[Capture]:
    url = database_url or DATABASE_URL
    reference = maintenant or datetime.now(timezone.utc)
    capture = lire_capture_par_id(identifiant, url)
    if capture is None:
        return None

    etat_courant = capture.revision_srs or EtatRevision(
        repetitions=0,
        intervalle_jours=0,
        facteur_aisance=2.5,
    )
    etat_calcule = calculer_revision_sm2(
        qualite=qualite,
        etat=EtatSRS(
            repetitions=etat_courant.repetitions,
            intervalle_jours=etat_courant.intervalle_jours,
            facteur_aisance=etat_courant.facteur_aisance,
            prochaine_revision=parse_datetime(etat_courant.prochaine_revision),
        ),
        maintenant=reference,
    )

    requete = adapter_requete(
        """
        UPDATE captures
        SET repetitions = ?,
            intervalle_jours = ?,
            facteur_aisance = ?,
            prochaine_revision = ?,
            derniere_revision = ?
        WHERE id = ?
        """,
        url,
    )

    with connecter_base(url) as connexion:
        connexion.execute(
            requete,
            [
                etat_calcule.repetitions,
                etat_calcule.intervalle_jours,
                etat_calcule.facteur_aisance,
                serialiser_datetime(etat_calcule.prochaine_revision, url),
                serialiser_datetime(reference, url),
                identifiant,
            ],
        )
        connexion.commit()

    return lire_capture_par_id(identifiant, url)


def lister_revisions_dues(
    database_url: Optional[str] = None,
    maintenant: Optional[datetime] = None,
) -> List[Capture]:
    url = database_url or DATABASE_URL
    reference = maintenant or datetime.now(timezone.utc)

    requete = adapter_requete(
        """
        SELECT
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision,
            created_at
        FROM captures
        WHERE prochaine_revision IS NOT NULL
        ORDER BY prochaine_revision ASC, id ASC
        """,
        url,
    )

    with connecter_base(url) as connexion:
        lignes = connexion.execute(requete).fetchall()

    captures = [ligne_vers_capture(ligne) for ligne in lignes]
    return [
        capture
        for capture in captures
        if capture.revision_srs
        and capture.revision_srs.prochaine_revision
        and parse_datetime(capture.revision_srs.prochaine_revision) <= reference
    ]


def rechercher_captures(
    query: str,
    database_url: Optional[str] = None,
    limite: int = 10,
) -> List[dict]:
    url = database_url or DATABASE_URL
    query_nettoyee = (query or "").strip()
    if not query_nettoyee or limite <= 0:
        return []

    requete = adapter_requete(
        """
        SELECT
            id,
            phrase_originale,
            traduction,
            audio_url,
            contexte_tags,
            formalite,
            latitude,
            longitude,
            langue,
            transcription_statut,
            transcription_modele,
            transcription_detail,
            analyse_statut,
            analyse_modele,
            analyse_detail,
            embedding,
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision,
            created_at
        FROM captures
        """,
        url,
    )

    vecteur_query = generer_embedding_texte(query_nettoyee)
    mots_query = set(normaliser_texte_semantique(query_nettoyee))

    with connecter_base(url) as connexion:
        lignes = connexion.execute(requete).fetchall()

    resultats = []
    for ligne in lignes:
        capture = ligne_vers_capture(ligne)
        vecteur_capture = lire_embedding_stocke(ligne["embedding"])
        if vecteur_capture is None:
            texte_capture = " ".join(
                texte
                for texte in [capture.phrase_originale, capture.traduction or ""]
                if texte
            )
            vecteur_capture = generer_embedding_texte(texte_capture)

        score = similarite_cosinus(vecteur_query, vecteur_capture)
        mots_capture = set(normaliser_texte_semantique(" ".join([capture.phrase_originale, capture.traduction or ""])))
        mots_tags = set(normaliser_texte_semantique(" ".join(capture.contexte_tags)))

        if mots_query & mots_capture:
            score += 0.2
        if mots_query & mots_tags:
            score += 0.1

        resultats.append(
            {
                "capture": capture,
                "score": round(score, 4),
            }
        )

    resultats_tries = sorted(
        [resultat for resultat in resultats if resultat["score"] > 0],
        key=lambda resultat: (
            resultat["score"],
            resultat["capture"].timestamp or "",
            resultat["capture"].id,
        ),
        reverse=True,
    )
    return resultats_tries[:limite]


def calculer_stats_captures(database_url: Optional[str] = None) -> dict:
    captures = lister_captures(database_url=database_url)
    revisions_dues = lister_revisions_dues(database_url=database_url)
    compteur_tags = Counter()
    compteur_langues = Counter()
    compteur_formalites = Counter()
    total_revisions_a_venir = 0
    total_revisions_recente = 0
    reference = datetime.now(timezone.utc)

    for capture in captures:
        compteur_tags.update(tag.lower() for tag in capture.contexte_tags if tag)
        compteur_langues.update(
            [capture.langue.strip().lower()]
            if capture.langue and capture.langue.strip()
            else ["inconnue"]
        )
        compteur_formalites.update(
            [capture.formalite.strip().lower()]
            if capture.formalite and capture.formalite.strip()
            else ["inconnue"]
        )
        if capture.revision_srs and capture.revision_srs.prochaine_revision:
            total_revisions_a_venir += 1
        if capture.revision_srs and capture.revision_srs.derniere_revision:
            derniere_revision = parse_datetime(capture.revision_srs.derniere_revision)
            if derniere_revision and derniere_revision >= reference - timedelta(days=7):
                total_revisions_recente += 1

    return {
        "total_captures": len(captures),
        "total_phrases_revisees": sum(
            1 for capture in captures if capture.revision_srs and capture.revision_srs.derniere_revision
        ),
        "total_revisions_dues": len(revisions_dues),
        "total_revisions_a_venir": total_revisions_a_venir,
        "total_revisions_recente": total_revisions_recente,
        "tags_dominants": [
            StatTag(tag=tag, total=total)
            for tag, total in compteur_tags.most_common(5)
        ],
        "repartition_langues": [
            StatRepartition(cle=langue, total=total)
            for langue, total in compteur_langues.most_common()
        ],
        "repartition_formalites": [
            StatRepartition(cle=formalite, total=total)
            for formalite, total in compteur_formalites.most_common()
        ],
    }


def calculer_analytics_captures(database_url: Optional[str] = None) -> dict:
    url = database_url or DATABASE_URL
    total_captures = lire_premiere_valeur(
        executer_unique(
            "SELECT COUNT(*) AS total FROM captures",
            url,
        )
    )
    total_phrases_maitrisees = lire_premiere_valeur(
        executer_unique(
            """
            SELECT COUNT(*) AS total
            FROM captures
            WHERE repetitions >= ?
            """,
            url,
            [MAITRISE_MIN_REPETITIONS],
        )
    )
    total_revisions_dues = lire_premiere_valeur(
        executer_unique(
            requete_revisions_dues(url),
            url,
        )
    )
    total_revisions_a_venir = lire_premiere_valeur(
        executer_unique(
            requete_revisions_a_venir(url),
            url,
        )
    )

    requete_themes = adapter_requete(
        requete_themes_maitrise(url),
        url,
    )
    with connecter_base(url) as connexion:
        lignes_themes = connexion.execute(requete_themes, [MAITRISE_MIN_REPETITIONS]).fetchall()
        lignes_dates = connexion.execute(requete_dates_activite(url)).fetchall()

    themes = [
        {
            "tag": normaliser_cle_texte(ligne["tag"]),
            "total": int(ligne["total"] or 0),
            "phrases_maitrisees": int(ligne["phrases_maitrisees"] or 0),
        }
        for ligne in lignes_themes
        if normaliser_cle_texte(ligne["tag"])
    ]

    taux_retenue = calculer_pourcentage(total_phrases_maitrisees, total_captures)
    dates_actives = extraire_dates_actives(lignes_dates)

    return {
        "total_captures": total_captures,
        "total_phrases_maitrisees": total_phrases_maitrisees,
        "taux_retenue": taux_retenue,
        "total_revisions_dues": total_revisions_dues,
        "total_revisions_a_venir": total_revisions_a_venir,
        "streak_jours": calculer_streak(dates_actives),
        "matrice_forces_faiblesses": [
            {
                "tag": theme["tag"],
                "total": theme["total"],
                "phrases_maitrisees": theme["phrases_maitrisees"],
                "taux_reussite": calculer_pourcentage(theme["phrases_maitrisees"], theme["total"]),
            }
            for theme in sorted(
                themes,
                key=lambda item: (
                    calculer_pourcentage(item["phrases_maitrisees"], item["total"]),
                    item["total"],
                ),
                reverse=True,
            )
        ],
    }


def verifier_sante_base(database_url: Optional[str] = None) -> bool:
    # Verifie que la base de donnees est accessible et fonctionnelle.
    try:
        url = database_url or DATABASE_URL
        with connecter_base(url) as connexion:
            connexion.execute("SELECT 1")
        return True
    except Exception:
        return False


def executer_unique(requete: str, database_url: str, params: Optional[Sequence[Any]] = None):
    with connecter_base(database_url) as connexion:
        ligne = connexion.execute(requete, params or []).fetchone()
    return ligne


def requete_revisions_dues(database_url: str) -> str:
    base = """
        SELECT COUNT(*) AS total
        FROM captures
        WHERE prochaine_revision IS NOT NULL
          AND prochaine_revision <= CURRENT_TIMESTAMP
    """
    if database_url.startswith("sqlite:///"):
        return base.replace("CURRENT_TIMESTAMP", "datetime('now')")
    return base


def requete_revisions_a_venir(database_url: str) -> str:
    base = """
        SELECT COUNT(*) AS total
        FROM captures
        WHERE prochaine_revision IS NOT NULL
    """
    return base


def requete_themes_maitrise(database_url: str) -> str:
    if database_url.startswith("sqlite:///"):
        return """
            SELECT
                lower(trim(tag.value)) AS tag,
                COUNT(*) AS total,
                SUM(CASE WHEN captures.repetitions >= ? THEN 1 ELSE 0 END) AS phrases_maitrisees
            FROM captures
            JOIN json_each(captures.contexte_tags) AS tag
            WHERE trim(COALESCE(tag.value, '')) <> ''
            GROUP BY lower(trim(tag.value))
            ORDER BY total DESC, tag ASC
        """

    return """
        SELECT
            lower(trim(tag.value)) AS tag,
            COUNT(*) AS total,
            SUM(CASE WHEN captures.repetitions >= ? THEN 1 ELSE 0 END) AS phrases_maitrisees
        FROM captures,
             LATERAL jsonb_array_elements_text(COALESCE(captures.contexte_tags, '[]'::jsonb)) AS tag(value)
        WHERE trim(COALESCE(tag.value, '')) <> ''
        GROUP BY lower(trim(tag.value))
        ORDER BY total DESC, tag ASC
    """


def requete_dates_activite(database_url: str) -> str:
    if database_url.startswith("sqlite:///"):
        return """
            SELECT DISTINCT date_value AS jour
            FROM (
                SELECT date(created_at) AS date_value FROM captures WHERE created_at IS NOT NULL
                UNION
                SELECT date(derniere_revision) AS date_value FROM captures WHERE derniere_revision IS NOT NULL
            )
            WHERE date_value IS NOT NULL
            ORDER BY date_value DESC
        """

    return """
        SELECT DISTINCT jour
        FROM (
            SELECT created_at::date::text AS jour FROM captures WHERE created_at IS NOT NULL
            UNION
            SELECT derniere_revision::date::text AS jour FROM captures WHERE derniere_revision IS NOT NULL
        ) AS activite
        WHERE jour IS NOT NULL
        ORDER BY jour DESC
    """


def normaliser_cle_texte(valeur: Any) -> str:
    if valeur is None:
        return ""
    return str(valeur).strip().lower()


def calculer_pourcentage(partie: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((partie / total) * 100, 1)


def extraire_dates_actives(lignes: Iterable[Any]) -> List[str]:
    dates: List[str] = []
    for ligne in lignes:
        valeur = ligne["jour"] if isinstance(ligne, dict) else ligne[0]
        if valeur is None:
            continue
        if hasattr(valeur, "isoformat"):
            dates.append(valeur.isoformat())
        else:
            dates.append(str(valeur))
    return dates


def calculer_streak(dates_actives: Sequence[str], reference: Optional[datetime] = None) -> int:
    if not dates_actives:
        return 0

    reference = reference or datetime.now(timezone.utc)
    jours = {
        datetime.fromisoformat(date_texte).date()
        for date_texte in dates_actives
        if date_texte
    }
    courant = reference.date()
    if courant not in jours:
        return 0

    streak = 0
    while courant in jours:
        streak += 1
        courant -= timedelta(days=1)
    return streak


def lire_premiere_valeur(ligne: Any):
    # Recupere la premiere valeur d'une ligne quel que soit le driver SQL utilise.
    if isinstance(ligne, dict):
        return next(iter(ligne.values()))
    return ligne[0]


def convertir_datetime_vers_iso(valeur: Any) -> Optional[str]:
    if valeur is None:
        return None
    if isinstance(valeur, str):
        return valeur
    return valeur.isoformat()


def parse_datetime(valeur: Optional[str]) -> Optional[datetime]:
    if valeur is None:
        return None
    return datetime.fromisoformat(valeur)


def serialiser_datetime(valeur: Optional[datetime], database_url: str) -> Optional[str | datetime]:
    if valeur is None:
        return None
    if database_url.startswith("sqlite:///"):
        return valeur.isoformat()
    return valeur


def filtrer_captures(
    captures: List[Capture],
    tag: Optional[str] = None,
    formalite: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    rayon_km: Optional[float] = None,
) -> List[Capture]:
    captures_filtrees = captures

    if tag:
        tag_normalise = tag.strip().lower()
        captures_filtrees = [
            capture
            for capture in captures_filtrees
            if any(tag_normalise == tag_capture.strip().lower() for tag_capture in capture.contexte_tags)
        ]

    if formalite:
        formalite_normalisee = formalite.strip().lower()
        captures_filtrees = [
            capture
            for capture in captures_filtrees
            if capture.formalite.lower() == formalite_normalisee
        ]

    if latitude is not None and longitude is not None:
        rayon = rayon_km if rayon_km is not None else 10.0
        captures_filtrees = [
            capture
            for capture in captures_filtrees
            if distance_km(
                latitude,
                longitude,
                capture.geolocalisation.latitude,
                capture.geolocalisation.longitude,
            ) <= rayon
        ]

    return captures_filtrees


def distance_km(latitude_1: float, longitude_1: float, latitude_2: float, longitude_2: float) -> float:
    rayon_terre_km = 6371.0
    delta_lat = radians(latitude_2 - latitude_1)
    delta_lon = radians(longitude_2 - longitude_1)
    lat_1 = radians(latitude_1)
    lat_2 = radians(latitude_2)

    a = sin(delta_lat / 2) ** 2 + cos(lat_1) * cos(lat_2) * sin(delta_lon / 2) ** 2
    return 2 * rayon_terre_km * asin(sqrt(a))
