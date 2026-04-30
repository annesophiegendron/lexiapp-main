import json
import uuid
from pathlib import Path
from typing import Any, List, Optional

try:
    from backend.config import DATABASE_URL
    from backend.models import Capture, CommandeCreationCapture, Geolocalisation
except ModuleNotFoundError:
    from config import DATABASE_URL
    from models import Capture, CommandeCreationCapture, Geolocalisation


# Schema PostgreSQL cible pour l'environnement local de stage.
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""

# Schema SQLite conserve pour les tests rapides sans service externe.
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
        connexion.commit()


def lister_captures(database_url: Optional[str] = None) -> List[Capture]:
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
            created_at
        FROM captures
        ORDER BY created_at DESC, id DESC
        """,
        url,
    )

    with connecter_base(url) as connexion:
        lignes = connexion.execute(requete).fetchall()

    return [ligne_vers_capture(ligne) for ligne in lignes]


def creer_capture(commande: CommandeCreationCapture, database_url: Optional[str] = None) -> Capture:
    # Enregistre une capture complete, puis relit la ligne pour renvoyer le format API final.
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
            langue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            langue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
