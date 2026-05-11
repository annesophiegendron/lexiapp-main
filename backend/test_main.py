import shutil
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

try:
    from backend import database, main
except ModuleNotFoundError:
    import database
    import main


class MainApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_url = f"sqlite:///{(Path(__file__).resolve().parent / 'test_suite.db').as_posix()}"
        cls.stockage_test = Path(__file__).resolve().parent / "test_stockage_audios"

        cls.original_initialiser_base = main.initialiser_base
        cls.original_alimenter_donnees_demo = main.alimenter_donnees_demo
        cls.original_lister_captures = main.lister_captures
        cls.original_creer_capture = main.creer_capture
        cls.original_lire_capture_par_id = main.lire_capture_par_id
        cls.original_chemin_stockage_audios = main.CHEMIN_STOCKAGE_AUDIOS
        cls.original_transcrire_audio = main.transcrire_audio
        cls.original_analyser_phrase = main.analyser_phrase
        cls.original_verifier_sante_base = main.verifier_sante_base
        cls.original_httpx_client = main.httpx.Client
        cls.original_collecter_preflight = main.collecter_preflight
        cls.original_resumer_preflight = main.resumer_preflight

        main.initialiser_base = lambda: database.initialiser_base(cls.database_url)
        main.alimenter_donnees_demo = lambda: database.alimenter_donnees_demo(cls.database_url)
        main.lister_captures = lambda: database.lister_captures(cls.database_url)
        main.creer_capture = lambda commande: database.creer_capture(commande, cls.database_url)
        main.lire_capture_par_id = lambda capture_id: database.lire_capture_par_id(capture_id, cls.database_url)
        main.CHEMIN_STOCKAGE_AUDIOS = cls.stockage_test
        main.transcrire_audio = lambda chemin_audio, langue=None: f"transcription test {langue or 'auto'}"
        main.analyser_phrase = lambda texte, langue=None: {
            "traduction": f"traduction de {texte}",
            "tags": ["test", "pipeline"],
            "formalite": "standard",
        }
        main.verifier_sante_base = lambda: True
        main.collecter_preflight = lambda: [
            {"statut": "OK", "sujet": "ollama API", "detail": "Endpoint http://localhost:11434/api/version"},
            {"statut": "OK", "sujet": "modele ollama", "detail": "Modele configure: llama3"},
        ]
        main.resumer_preflight = lambda checks: {
            "status": "ok",
            "message": "Environnement coherent pour continuer la phase 2.",
        }

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

        cls.faux_httpx_client = FauxClientHttpx
        main.httpx.Client = FauxClientHttpx

        database.initialiser_base(cls.database_url)
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        main.initialiser_base = cls.original_initialiser_base
        main.alimenter_donnees_demo = cls.original_alimenter_donnees_demo
        main.lister_captures = cls.original_lister_captures
        main.creer_capture = cls.original_creer_capture
        main.lire_capture_par_id = cls.original_lire_capture_par_id
        main.CHEMIN_STOCKAGE_AUDIOS = cls.original_chemin_stockage_audios
        main.transcrire_audio = cls.original_transcrire_audio
        main.analyser_phrase = cls.original_analyser_phrase
        main.verifier_sante_base = cls.original_verifier_sante_base
        main.httpx.Client = cls.original_httpx_client
        main.collecter_preflight = cls.original_collecter_preflight
        main.resumer_preflight = cls.original_resumer_preflight

        test_db = Path(cls.database_url.replace("sqlite:///", "", 1))
        if test_db.exists():
            try:
                test_db.unlink()
            except PermissionError:
                pass

    def setUp(self):
        database.initialiser_base(self.__class__.database_url)
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()
        database.alimenter_donnees_demo(self.__class__.database_url)
        if self.__class__.stockage_test.exists():
            shutil.rmtree(self.__class__.stockage_test)

    def test_health_route(self):
        response = self.client.get("/sante")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_health_route_returns_degraded_when_ollama_is_down(self):
        class FauxClientHttpxEnEchec:
            def __init__(self, *args, **kwargs):
                pass

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def get(self, url):
                raise RuntimeError("ollama coupe")

        main.httpx.Client = FauxClientHttpxEnEchec
        try:
            response = self.client.get("/sante")
        finally:
            main.httpx.Client = self.__class__.faux_httpx_client

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertIn("Ollama indisponible", response.json()["message"])

    def test_preflight_route(self):
        response = self.client.get("/preflight")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["message"], "Environnement coherent pour continuer la phase 2.")
        self.assertEqual(len(payload["checks"]), 2)
        self.assertEqual(payload["checks"][0]["statut"], "OK")
        self.assertEqual(payload["checks"][1]["sujet"], "modele ollama")

    def test_preflight_route_returns_degraded_summary(self):
        main.collecter_preflight = lambda: [
            {"statut": "FAIL", "sujet": "postgresql TCP", "detail": "localhost:5432"},
        ]
        main.resumer_preflight = lambda checks: {
            "status": "degraded",
            "message": "Environnement incomplet pour la phase 2.",
        }

        try:
            response = self.client.get("/preflight")
        finally:
            main.collecter_preflight = lambda: [
                {"statut": "OK", "sujet": "ollama API", "detail": "Endpoint http://localhost:11434/api/version"},
                {"statut": "OK", "sujet": "modele ollama", "detail": "Modele configure: llama3"},
            ]
            main.resumer_preflight = lambda checks: {
                "status": "ok",
                "message": "Environnement coherent pour continuer la phase 2.",
            }

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "degraded")
        self.assertEqual(payload["checks"][0]["sujet"], "postgresql TCP")

    def test_root_route(self):
        response = self.client.get("/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["documentation"], "/docs")
        self.assertEqual(payload["sante"], "/sante")
        self.assertEqual(payload["preflight"], "/preflight")
        self.assertEqual(payload["captures"], "/captures")

    def test_get_captures_route(self):
        response = self.client.get("/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["id"], "00000000-0000-0000-0000-000000000001")
        self.assertEqual(payload["captures"][0]["pipeline_ia"]["transcription"]["modele"], "base")
        self.assertEqual(payload["captures"][0]["pipeline_ia"]["analyse"]["statut"], "ok")

    def test_get_capture_by_id_route(self):
        response = self.client.get("/captures/00000000-0000-0000-0000-000000000001")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["id"], "00000000-0000-0000-0000-000000000001")
        self.assertEqual(payload["phrase_originale"], "texte transcrit par l'ia")
        self.assertEqual(payload["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["modele"], "llama3")

    def test_get_capture_by_id_route_returns_404(self):
        response = self.client.get("/captures/00000000-0000-0000-0000-000000000099")

        self.assertEqual(response.status_code, 404)
        self.assertIn("non trouvee", response.json()["detail"])

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
        self.assertEqual(payload["capture"]["phrase_originale"], "transcription test fr")
        self.assertEqual(payload["capture"]["traduction"], "traduction de transcription test fr")
        self.assertEqual(payload["capture"]["contexte_tags"], ["test", "pipeline"])
        self.assertEqual(payload["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["pipeline_ia"]["transcription"]["modele"], "base")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["statut"], "ok")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["modele"], "llama3")
        self.assertEqual(payload["capture"]["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["capture"]["pipeline_ia"]["analyse"]["modele"], "llama3")
        nom_fichier = payload["capture"]["audio_url"].split("/")[-1]
        self.assertTrue((self.__class__.stockage_test / nom_fichier).exists())

        get_response = self.client.get("/captures")
        get_payload = get_response.json()

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_payload["total"], 2)
        self.assertEqual(get_payload["captures"][0]["audio_url"], payload["capture"]["audio_url"])
        self.assertEqual(get_payload["captures"][0]["phrase_originale"], "transcription test fr")
        self.assertEqual(get_payload["captures"][0]["pipeline_ia"]["transcription"]["modele"], "base")
        self.assertEqual(get_payload["captures"][0]["pipeline_ia"]["analyse"]["modele"], "llama3")

        audio_response = self.client.get(payload["capture"]["audio_url"])
        self.assertEqual(audio_response.status_code, 200)
        self.assertEqual(audio_response.content, b"RIFF....WAVE")

    def test_post_captures_returns_500_when_transcription_fails(self):
        main.transcrire_audio = lambda chemin_audio, langue=None: (_ for _ in ()).throw(RuntimeError("modele indisponible"))

        try:
            response = self.client.post(
                "/captures",
                files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
                data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
            )
        finally:
            main.transcrire_audio = lambda chemin_audio, langue=None: f"transcription test {langue or 'auto'}"

        self.assertEqual(response.status_code, 500)
        self.assertIn("Erreur lors de la transcription audio", response.json()["detail"])
        self.assertEqual(list(self.__class__.stockage_test.glob("*")), [])

    def test_post_captures_falls_back_when_ollama_fails(self):
        main.analyser_phrase = lambda texte, langue=None: (_ for _ in ()).throw(RuntimeError("ollama indisponible"))

        try:
            response = self.client.post(
                "/captures",
                files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
                data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
            )
        finally:
            main.analyser_phrase = lambda texte, langue=None: {
                "traduction": f"traduction de {texte}",
                "tags": ["test", "pipeline"],
                "formalite": "standard",
            }

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(payload["capture"]["traduction"])
        self.assertEqual(payload["capture"]["contexte_tags"], [])
        self.assertEqual(payload["capture"]["formalite"], "standard")
        self.assertEqual(payload["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["statut"], "fallback")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["modele"], "llama3")
        self.assertEqual(payload["capture"]["pipeline_ia"]["analyse"]["statut"], "fallback")

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
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()

        response = self.client.get("/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 0)
        self.assertEqual(payload["captures"], [])

    def test_resoudre_chemin_audio_uses_configured_storage_directory(self):
        chemin = main.resoudre_chemin_audio("/stockage/audios/test.wav")
        self.assertEqual(chemin, self.__class__.stockage_test / "test.wav")


if __name__ == "__main__":
    unittest.main()
