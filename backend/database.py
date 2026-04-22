import json
import sqlite3
import uuid
from pathlib import Path
from typing import List, Optional

from models import Capture, CommandeCreationCapture, Geolocalisation


CHEMIN_BASE = Path(__file__).resolve().parent / "lexiapp.db"


def connecter_base(db_path: Optional[Path] = None) -> sqlite3.Connection:
    chemin = Path(db_path) if db_path else CHEMIN_BASE
    chemin.parent.mkdir(parents=True, exist_ok=True)
    connexion = sqlite3.connect(chemin)
    connexion.row_factory = sqlite3.Row
    return connexion


def initialiser_base(db_path: Optional[Path] = None) -> None:
    with connecter_base(db_path) as connexion:
        connexion.execute(
            """
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
        )
        connexion.commit()


def lister_captures(db_path: Optional[Path] = None) -> List[Capture]:
    with connecter_base(db_path) as connexion:
        lignes = connexion.execute(
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
                langue
            FROM captures
            ORDER BY datetime(created_at) DESC, id DESC
            """
        ).fetchall()

    return [ligne_vers_capture(ligne) for ligne in lignes]


def creer_capture(commande: CommandeCreationCapture, db_path: Optional[Path] = None) -> Capture:
    identifiant = f"capture-{uuid.uuid4().hex[:12]}"

    with connecter_base(db_path) as connexion:
        connexion.execute(
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
            (
                identifiant,
                commande.phrase_originale,
                commande.traduction,
                commande.audio_url,
                json.dumps(commande.contexte_tags, ensure_ascii=True),
                commande.formalite,
                commande.latitude,
                commande.longitude,
                commande.langue,
            ),
        )
        connexion.commit()

    return Capture(
        id=identifiant,
        phrase_originale=commande.phrase_originale,
        traduction=commande.traduction,
        audio_url=commande.audio_url,
        contexte_tags=commande.contexte_tags,
        formalite=commande.formalite,
        geolocalisation=Geolocalisation(
            latitude=commande.latitude,
            longitude=commande.longitude,
        ),
        langue=commande.langue,
    )


def alimenter_donnees_demo(db_path: Optional[Path] = None) -> None:
    with connecter_base(db_path) as connexion:
        total = connexion.execute("SELECT COUNT(*) FROM captures").fetchone()[0]
        if total:
            return

        connexion.execute(
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
            (
                "capture-001",
                "texte transcrit par l'ia",
                "exemple de traduction",
                "/stockage/audios/exemple.wav",
                json.dumps(["voyage", "situation-reelle"], ensure_ascii=True),
                "standard",
                48.8566,
                2.3522,
                "fr",
            ),
        )
        connexion.commit()


def ligne_vers_capture(ligne: sqlite3.Row) -> Capture:
    return Capture(
        id=ligne["id"],
        phrase_originale=ligne["phrase_originale"],
        traduction=ligne["traduction"],
        audio_url=ligne["audio_url"],
        contexte_tags=json.loads(ligne["contexte_tags"]),
        formalite=ligne["formalite"],
        geolocalisation=Geolocalisation(
            latitude=ligne["latitude"],
            longitude=ligne["longitude"],
        ),
        langue=ligne["langue"],
    )
