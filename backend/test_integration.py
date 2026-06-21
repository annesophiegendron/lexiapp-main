import asyncio
import shutil
import unittest
from datetime import datetime, timezone
from pathlib import Path

import httpx

try:
    from backend import database, main, storage
except ModuleNotFoundError:
    import database
    import main
    import storage


class FauxClientHttpx:
    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def get(self, url):
        class Reponse:
            status_code = 200

        return Reponse()


class IntegrationApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_url = f"sqlite:///{(Path(__file__).resolve().parent / 'integration_test.db').as_posix()}"
        cls.stockage_test = Path(__file__).resolve().parent / "integration_stockage_audios"

        cls.original_initialiser_base = main.initialiser_base
        cls.original_alimenter_donnees_demo = main.alimenter_donnees_demo
        cls.original_lister_captures = main.lister_captures
        cls.original_calculer_stats_captures = main.calculer_stats_captures
        cls.original_calculer_analytics_captures = main.calculer_analytics_captures
        cls.original_creer_capture = main.creer_capture
        cls.original_lire_capture_par_id = main.lire_capture_par_id
        cls.original_lister_revisions_dues = main.lister_revisions_dues
        cls.original_noter_revision_capture = main.noter_revision_capture
        cls.original_chemin_stockage_audios = main.CHEMIN_STOCKAGE_AUDIOS
        cls.original_storage_audio_dir = storage.AUDIO_STORAGE_DIR
        cls.original_transcrire_audio = main.transcrire_audio
        cls.original_analyser_phrase = main.analyser_phrase
        cls.original_verifier_sante_base = main.verifier_sante_base
        cls.original_httpx_client = main.httpx.Client
        cls.original_collecter_preflight = main.collecter_preflight
        cls.original_resumer_preflight = main.resumer_preflight

        main.initialiser_base = lambda: database.initialiser_base(cls.database_url)
        main.alimenter_donnees_demo = lambda: database.alimenter_donnees_demo(cls.database_url)
        main.lister_captures = lambda **kwargs: database.lister_captures(cls.database_url, **kwargs)
        main.calculer_stats_captures = lambda: database.calculer_stats_captures(cls.database_url)
        main.calculer_analytics_captures = lambda: database.calculer_analytics_captures(cls.database_url)
        main.creer_capture = lambda commande: database.creer_capture(commande, cls.database_url)
        main.lire_capture_par_id = lambda capture_id: database.lire_capture_par_id(capture_id, cls.database_url)
        main.lister_revisions_dues = lambda: database.lister_revisions_dues(cls.database_url)
        main.noter_revision_capture = lambda capture_id, qualite: database.noter_revision_capture(
            capture_id,
            qualite,
            cls.database_url,
        )
        main.CHEMIN_STOCKAGE_AUDIOS = cls.stockage_test
        storage.AUDIO_STORAGE_DIR = cls.stockage_test
        main.transcrire_audio = lambda chemin_audio, langue=None: f"transcription test {langue or 'auto'}"
        main.analyser_phrase = lambda texte, langue=None: {
            "traduction": f"traduction de {texte}",
            "tags": ["test", "voyage"],
            "formalite": "standard",
        }
        main.verifier_sante_base = lambda: True
        main.httpx.Client = FauxClientHttpx
        main.collecter_preflight = lambda: [
            {"statut": "OK", "sujet": "ollama API", "detail": "Endpoint http://localhost:11434/api/version"},
            {"statut": "OK", "sujet": "modele ollama", "detail": "Modele configure: llama3"},
        ]
        main.resumer_preflight = lambda checks: {
            "status": "ok",
            "message": "Environnement coherent pour continuer la phase 2.",
        }

        database.initialiser_base(cls.database_url)

    @classmethod
    def tearDownClass(cls):
        main.initialiser_base = cls.original_initialiser_base
        main.alimenter_donnees_demo = cls.original_alimenter_donnees_demo
        main.lister_captures = cls.original_lister_captures
        main.calculer_stats_captures = cls.original_calculer_stats_captures
        main.calculer_analytics_captures = cls.original_calculer_analytics_captures
        main.creer_capture = cls.original_creer_capture
        main.lire_capture_par_id = cls.original_lire_capture_par_id
        main.lister_revisions_dues = cls.original_lister_revisions_dues
        main.noter_revision_capture = cls.original_noter_revision_capture
        main.CHEMIN_STOCKAGE_AUDIOS = cls.original_chemin_stockage_audios
        storage.AUDIO_STORAGE_DIR = cls.original_storage_audio_dir
        main.transcrire_audio = cls.original_transcrire_audio
        main.analyser_phrase = cls.original_analyser_phrase
        main.verifier_sante_base = cls.original_verifier_sante_base
        main.httpx.Client = cls.original_httpx_client
        main.collecter_preflight = cls.original_collecter_preflight
        main.resumer_preflight = cls.original_resumer_preflight

        db_path = Path(cls.database_url.replace("sqlite:///", "", 1))
        if db_path.exists():
            try:
                db_path.unlink()
            except PermissionError:
                pass
        if cls.stockage_test.exists():
            shutil.rmtree(cls.stockage_test)

    def setUp(self):
        database.initialiser_base(self.__class__.database_url)
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()
        if self.__class__.stockage_test.exists():
            shutil.rmtree(self.__class__.stockage_test)

    def request(self, method, url, **kwargs):
        async def _executer():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=main.app),
                base_url="http://testserver",
            ) as client:
                return await client.request(method, url, **kwargs)

        return asyncio.run(_executer())

    def test_capture_lifecycle_and_analytics_roundtrip(self):
        response = self.request(
            "POST",
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 200)
        capture = response.json()["capture"]
        capture_id = capture["id"]

        stored_capture = database.lire_capture_par_id(capture_id, self.__class__.database_url)
        self.assertIsNotNone(stored_capture)
        self.assertEqual(stored_capture.phrase_originale, "transcription test fr")

        listing = self.request("GET", "/captures")
        listing_payload = listing.json()
        self.assertEqual(listing.status_code, 200)
        self.assertGreaterEqual(listing_payload["total"], 1)
        self.assertEqual(listing_payload["captures"][0]["id"], capture_id)
        self.assertEqual(listing_payload["captures"][0]["pipeline_ia"]["analyse"]["modele"], "llama3")

        now = datetime.now(timezone.utc).isoformat()
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute(
                database.adapter_requete(
                    """
                    UPDATE captures
                    SET repetitions = ?,
                        intervalle_jours = ?,
                        facteur_aisance = ?,
                        prochaine_revision = ?,
                        derniere_revision = ?,
                        created_at = ?
                    WHERE id = ?
                    """,
                    self.__class__.database_url,
                ),
                [
                    3,
                    14,
                    2.4,
                    now,
                    now,
                    now,
                    capture_id,
                ],
            )
            connexion.commit()

        analytics = self.request("GET", "/analytics")
        analytics_payload = analytics.json()
        self.assertEqual(analytics.status_code, 200)
        self.assertGreaterEqual(analytics_payload["total_captures"], 1)
        self.assertGreaterEqual(analytics_payload["total_phrases_maitrisees"], 1)
        self.assertIn("matrice_forces_faiblesses", analytics_payload)
        self.assertIsInstance(analytics_payload["matrice_forces_faiblesses"], list)


if __name__ == "__main__":
    unittest.main()
