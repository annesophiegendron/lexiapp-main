import unittest
from pathlib import Path
import shutil

from fastapi.testclient import TestClient

import database
import main


class MainApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_path = Path(__file__).resolve().parent / "test_suite.db"
        cls.stockage_test = Path(__file__).resolve().parent / "test_stockage_audios"

        cls.original_initialiser_base = main.initialiser_base
        cls.original_alimenter_donnees_demo = main.alimenter_donnees_demo
        cls.original_lister_captures = main.lister_captures
        cls.original_creer_capture = main.creer_capture
        cls.original_chemin_stockage_audios = main.CHEMIN_STOCKAGE_AUDIOS

        main.initialiser_base = lambda: database.initialiser_base(cls.db_path)
        main.alimenter_donnees_demo = lambda: database.alimenter_donnees_demo(cls.db_path)
        main.lister_captures = lambda: database.lister_captures(cls.db_path)
        main.creer_capture = lambda commande: database.creer_capture(commande, cls.db_path)
        main.CHEMIN_STOCKAGE_AUDIOS = cls.stockage_test

        database.initialiser_base(cls.db_path)
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        main.initialiser_base = cls.original_initialiser_base
        main.alimenter_donnees_demo = cls.original_alimenter_donnees_demo
        main.lister_captures = cls.original_lister_captures
        main.creer_capture = cls.original_creer_capture
        main.CHEMIN_STOCKAGE_AUDIOS = cls.original_chemin_stockage_audios

    def setUp(self):
        database.initialiser_base(self.__class__.db_path)
        with database.connecter_base(self.__class__.db_path) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()
        database.alimenter_donnees_demo(self.__class__.db_path)
        if self.__class__.stockage_test.exists():
            shutil.rmtree(self.__class__.stockage_test)

    def test_health_route(self):
        response = self.client.get("/sante")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_root_route(self):
        response = self.client.get("/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["documentation"], "/docs")
        self.assertEqual(payload["sante"], "/sante")

    def test_get_captures_route(self):
        response = self.client.get("/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["id"], "capture-001")

    def test_post_captures_accepts_audio(self):
        response = self.client.post(
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
        )
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "success")
        self.assertTrue(payload["capture"]["audio_url"].startswith("/stockage/audios/"))
        self.assertTrue(payload["capture"]["audio_url"].endswith(".wav"))
        self.assertEqual(payload["capture"]["langue"], "fr")
        nom_fichier = payload["capture"]["audio_url"].split("/")[-1]
        self.assertTrue((self.__class__.stockage_test / nom_fichier).exists())

        get_response = self.client.get("/captures")
        get_payload = get_response.json()

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_payload["total"], 2)
        self.assertEqual(get_payload["captures"][0]["audio_url"], payload["capture"]["audio_url"])

    def test_post_captures_rejects_non_audio(self):
        response = self.client.post(
            "/captures",
            files={"audio": ("test.txt", b"hello", "text/plain")},
            data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Le fichier envoye doit etre un audio valide.")

    def test_post_captures_rejects_missing_latitude(self):
        response = self.client.post(
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"longitude": "2.3522", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 422)

    def test_post_captures_rejects_missing_longitude(self):
        response = self.client.post(
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"latitude": "48.8566", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 422)

    def test_get_captures_route_when_database_is_empty(self):
        with database.connecter_base(self.__class__.db_path) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()

        response = self.client.get("/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 0)
        self.assertEqual(payload["captures"], [])


if __name__ == "__main__":
    unittest.main()
