import json
import uuid
from collections import Counter
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any, List, Optional

try:
    from backend.config import DATABASE_URL
    from backend.models import Capture, CommandeCreationCapture, EtatRevision, Geolocalisation, PipelineIA, StatRepartition, StatTag, StatutEtapeIA
    from backend.phase3 import EtatSRS, calculer_revision_sm2
except ModuleNotFoundError:
    from config import DATABASE_URL
    from models import Capture, CommandeCreationCapture, EtatRevision, Geolocalisation, PipelineIA, StatRepartition, StatTag, StatutEtapeIA
    from phase3 import EtatSRS, calculer_revision_sm2


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

    return psycopg.connect(url, row_factory=psycopg.rows.dict_row)


def preparer_tags_pour_stockage(tags: List[str], database_url: str):
    # Adapte les tags au type attendu par le driver SQL cible.
    if database_url.startswith("sqlite:///"):
        return json.dumps(tags, ensure_ascii=True)

    from psycopg.types.json import Jsonb

    return Jsonb(tags)


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
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            repetitions,
            intervalle_jours,
            facteur_aisance,
            prochaine_revision,
            derniere_revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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


def calculer_stats_captures(database_url: Optional[str] = None) -> dict:
    captures = lister_captures(database_url=database_url)
    revisions_dues = lister_revisions_dues(database_url=database_url)
    compteur_tags = Counter()
    compteur_langues = Counter()
    compteur_formalites = Counter()
    total_revisions_a_venir = 0

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

    return {
        "total_captures": len(captures),
        "total_phrases_revisees": sum(
            1 for capture in captures if capture.revision_srs and capture.revision_srs.derniere_revision
        ),
        "total_revisions_dues": len(revisions_dues),
        "total_revisions_a_venir": total_revisions_a_venir,
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


def verifier_sante_base(database_url: Optional[str] = None) -> bool:
    # Verifie que la base de donnees est accessible et fonctionnelle.
    try:
        url = database_url or DATABASE_URL
        with connecter_base(url) as connexion:
            connexion.execute("SELECT 1")
        return True
    except Exception:
        return False


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
            if any(tag_capture.lower() == tag_normalise for tag_capture in capture.contexte_tags)
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
