import shutil
import unittest
from datetime import datetime, timezone
from pathlib import Path

import anyio
import httpx

try:
    from backend import database, main, storage
except ModuleNotFoundError:
    import database
    import main
    import storage


class MainApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_url = f"sqlite:///{(Path(__file__).resolve().parent / 'test_suite.db').as_posix()}"
        cls.stockage_test = Path(__file__).resolve().parent / "test_stockage_audios"

        cls.original_initialiser_base = main.initialiser_base
        cls.original_alimenter_donnees_demo = main.alimenter_donnees_demo
        cls.original_lister_captures = main.lister_captures
        cls.original_rechercher_captures = main.rechercher_captures
        cls.original_calculer_stats_captures = main.calculer_stats_captures
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
        main.rechercher_captures = lambda query, limite=10: database.rechercher_captures(
            query,
            cls.database_url,
            limite,
        )
        main.calculer_stats_captures = lambda: database.calculer_stats_captures(cls.database_url)
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
        transport = httpx.ASGITransport(app=main.app)
        cls.client = httpx.Client(transport=transport, base_url="http://testserver")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls.client, "close"):
            cls.client.close()
        main.initialiser_base = cls.original_initialiser_base
        main.alimenter_donnees_demo = cls.original_alimenter_donnees_demo
        main.lister_captures = cls.original_lister_captures
        main.rechercher_captures = cls.original_rechercher_captures
        main.calculer_stats_captures = cls.original_calculer_stats_captures
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
        response = self.request("GET", "/sante")

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
            response = self.request("GET", "/sante")
        finally:
            main.httpx.Client = self.__class__.faux_httpx_client

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertIn("Ollama indisponible", response.json()["message"])

    def test_preflight_route(self):
        response = self.request("GET", "/preflight")
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
            response = self.request("GET", "/preflight")
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

    def test_preflight_route_returns_warning_when_only_ollama_is_missing(self):
        main.collecter_preflight = lambda: [
            {"statut": "WARN", "sujet": "ollama API", "detail": "Endpoint http://localhost:11434/api/version"},
            {"statut": "WARN", "sujet": "modele ollama", "detail": "Modele configure: llama3"},
        ]
        main.resumer_preflight = lambda checks: {
            "status": "warning",
            "message": "Environnement exploitable avec avertissements.",
        }

        try:
            response = self.request("GET", "/preflight")
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
        self.assertEqual(payload["status"], "warning")
        self.assertEqual(payload["checks"][0]["sujet"], "ollama API")

    def test_root_route(self):
        response = self.request("GET", "/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["documentation"], "/docs")
        self.assertEqual(payload["sante"], "/sante")
        self.assertEqual(payload["preflight"], "/preflight")
        self.assertEqual(payload["captures"], "/captures")
        self.assertEqual(payload["revisions_due"], "/revisions/due")
        self.assertEqual(payload["stats"], "/stats")

    def test_get_captures_route(self):
        response = self.request("GET", "/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["id"], "00000000-0000-0000-0000-000000000001")
        self.assertEqual(payload["captures"][0]["pipeline_ia"]["transcription"]["modele"], "base")
        self.assertEqual(payload["captures"][0]["pipeline_ia"]["analyse"]["statut"], "ok")
        self.assertIsNone(payload["captures"][0]["pipeline_ia"]["analyse"]["detail"])

    def test_get_capture_by_id_route(self):
        response = self.request("GET", "/captures/00000000-0000-0000-0000-000000000001")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["id"], "00000000-0000-0000-0000-000000000001")
        self.assertEqual(payload["phrase_originale"], "texte transcrit par l'ia")
        self.assertEqual(payload["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["pipeline_ia"]["analyse"]["modele"], "llama3")
        self.assertIsNone(payload["pipeline_ia"]["transcription"]["detail"])

    def test_get_capture_by_id_route_returns_404(self):
        response = self.request("GET", "/captures/00000000-0000-0000-0000-000000000099")

        self.assertEqual(response.status_code, 404)
        self.assertIn("non trouvee", response.json()["detail"])

    def test_post_captures_accepts_audio(self):
        response = self.request(
            "POST",
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
        self.assertIsNone(payload["pipeline_ia"]["analyse"]["detail"])
        self.assertEqual(payload["capture"]["pipeline_ia"]["transcription"]["statut"], "ok")
        self.assertEqual(payload["capture"]["pipeline_ia"]["analyse"]["modele"], "llama3")
        self.assertIsNone(payload["capture"]["pipeline_ia"]["transcription"]["detail"])
        self.assertEqual(payload["capture"]["revision_srs"]["repetitions"], 0)
        self.assertIsNone(payload["capture"]["revision_srs"]["prochaine_revision"])
        nom_fichier = payload["capture"]["audio_url"].split("/")[-1]
        self.assertTrue((self.__class__.stockage_test / nom_fichier).exists())

        get_response = self.request("GET", "/captures")
        get_payload = get_response.json()

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_payload["total"], 2)
        self.assertEqual(get_payload["captures"][0]["audio_url"], payload["capture"]["audio_url"])
        self.assertEqual(get_payload["captures"][0]["phrase_originale"], "transcription test fr")
        self.assertEqual(get_payload["captures"][0]["pipeline_ia"]["transcription"]["modele"], "base")
        self.assertEqual(get_payload["captures"][0]["pipeline_ia"]["analyse"]["modele"], "llama3")
        self.assertIsNone(get_payload["captures"][0]["pipeline_ia"]["analyse"]["detail"])

        audio_response = self.request("GET", payload["capture"]["audio_url"])
        self.assertEqual(audio_response.status_code, 200)
        self.assertEqual(audio_response.content, b"RIFF....WAVE")

    def test_post_captures_returns_500_when_transcription_fails(self):
        main.transcrire_audio = lambda chemin_audio, langue=None: (_ for _ in ()).throw(RuntimeError("modele indisponible"))

        try:
            response = self.request(
                "POST",
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
            response = self.request(
                "POST",
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
        self.assertEqual(payload["pipeline_ia"]["analyse"]["detail"], "ollama indisponible")
        self.assertEqual(payload["capture"]["pipeline_ia"]["analyse"]["statut"], "fallback")
        self.assertEqual(payload["capture"]["pipeline_ia"]["analyse"]["detail"], "ollama indisponible")

    def test_post_captures_rejects_non_audio(self):
        response = self.request(
            "POST",
            "/captures",
            files={"audio": ("test.txt", b"hello", "text/plain")},
            data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Le fichier envoye doit etre un audio valide.")

    def test_post_captures_rejects_missing_latitude(self):
        response = self.request(
            "POST",
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"longitude": "2.3522", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 422)

    def test_post_captures_rejects_missing_longitude(self):
        response = self.request(
            "POST",
            "/captures",
            files={"audio": ("test.wav", b"RIFF....WAVE", "audio/wav")},
            data={"latitude": "48.8566", "langue": "fr"},
        )

        self.assertEqual(response.status_code, 422)

    def test_get_captures_route_when_database_is_empty(self):
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()

        response = self.request("GET", "/captures")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 0)
        self.assertEqual(payload["captures"], [])

    def test_get_captures_route_filters_by_tag(self):
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="bonjour au cafe",
                traduction="hello at the cafe",
                audio_url="/stockage/audios/cafe.wav",
                contexte_tags=["cafe", "politesse"],
                formalite="familier",
                latitude=48.857,
                longitude=2.351,
                langue="fr",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )

        response = self.request("GET", "/captures?tag=cafe")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["contexte_tags"], ["cafe", "politesse"])

    def test_get_captures_route_filters_tag_exactly(self):
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="bonjour au cafe",
                traduction="hello at the cafe",
                audio_url="/stockage/audios/cafe.wav",
                contexte_tags=["cafe", "politesse"],
                formalite="familier",
                latitude=48.857,
                longitude=2.351,
                langue="fr",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )

        response = self.request("GET", "/captures?tag=caf")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 0)
        self.assertEqual(payload["captures"], [])

    def test_get_captures_route_filters_by_formalite(self):
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="excuse me",
                traduction="excusez-moi",
                audio_url="/stockage/audios/poli.wav",
                contexte_tags=["politesse"],
                formalite="soutenu",
                latitude=48.858,
                longitude=2.35,
                langue="en",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )

        response = self.request("GET", "/captures?formalite=soutenu")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["formalite"], "soutenu")

    def test_get_captures_route_filters_by_zone(self):
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="loin d'ici",
                traduction="far away",
                audio_url="/stockage/audios/loin.wav",
                contexte_tags=["voyage"],
                formalite="standard",
                latitude=45.764,
                longitude=4.8357,
                langue="fr",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )

        response = self.request("GET", "/captures?latitude=48.8566&longitude=2.3522&rayon_km=5")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["id"], "00000000-0000-0000-0000-000000000001")

    def test_search_captures_route_returns_semantic_match(self):
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute("DELETE FROM captures")
            connexion.commit()

        capture_pertinente = database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="Je voudrais un cafe et un croissant s'il vous plait",
                traduction="I would like a coffee and a croissant please",
                audio_url="/stockage/audios/cafe.wav",
                contexte_tags=["restaurant", "nourriture"],
                formalite="standard",
                latitude=48.8566,
                longitude=2.3522,
                langue="fr",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="Bonjour, comment allez-vous ?",
                traduction="Hello, how are you?",
                audio_url="/stockage/audios/salut.wav",
                contexte_tags=["salutation"],
                formalite="familier",
                latitude=48.857,
                longitude=2.351,
                langue="fr",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )

        response = self.request("GET", "/captures/search?query=Commander%20%C3%A0%20manger&limite=5")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["query"], "Commander à manger")
        self.assertGreaterEqual(payload["total"], 1)
        self.assertEqual(payload["results"][0]["capture"]["id"], capture_pertinente.id)
        self.assertGreater(payload["results"][0]["score"], 0)

    def test_search_captures_route_rejects_empty_query(self):
        response = self.request("GET", "/captures/search?query=")

        self.assertEqual(response.status_code, 400)
        self.assertIn("ne peut pas etre vide", response.json()["detail"])

    def test_get_captures_route_rejects_partial_zone_filter(self):
        response = self.request("GET", "/captures?latitude=48.8566")

        self.assertEqual(response.status_code, 400)
        self.assertIn("latitude et longitude", response.json()["detail"])

    def test_resoudre_chemin_audio_uses_configured_storage_directory(self):
        chemin = main.resoudre_chemin_audio("/stockage/audios/test.wav")
        self.assertEqual(chemin, self.__class__.stockage_test / "test.wav")

    def test_post_review_updates_srs_state(self):
        response = self.request(
            "POST",
            "/captures/00000000-0000-0000-0000-000000000001/review",
            json={"qualite": 5},
        )
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "success")
        self.assertEqual(payload["revision_srs"]["repetitions"], 1)
        self.assertEqual(payload["revision_srs"]["intervalle_jours"], 1)
        self.assertIsNotNone(payload["revision_srs"]["prochaine_revision"])
        self.assertIsNotNone(payload["revision_srs"]["derniere_revision"])
        self.assertEqual(payload["capture"]["revision_srs"]["repetitions"], 1)

    def test_post_review_returns_404_for_unknown_capture(self):
        response = self.request(
            "POST",
            "/captures/00000000-0000-0000-0000-000000000099/review",
            json={"qualite": 3},
        )

        self.assertEqual(response.status_code, 404)
        self.assertIn("non trouvee", response.json()["detail"])

    def test_get_due_revisions_returns_only_due_items(self):
        database.noter_revision_capture(
            "00000000-0000-0000-0000-000000000001",
            5,
            self.__class__.database_url,
        )
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute(
                database.adapter_requete(
                    "UPDATE captures SET prochaine_revision = ?, derniere_revision = ? WHERE id = ?",
                    self.__class__.database_url,
                ),
                [
                    "2026-05-01T09:00:00+00:00",
                    "2026-04-30T09:00:00+00:00",
                    "00000000-0000-0000-0000-000000000001",
                ],
            )
            connexion.commit()

        response = self.request("GET", "/revisions/due")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["captures"][0]["id"], "00000000-0000-0000-0000-000000000001")
        self.assertEqual(payload["captures"][0]["revision_srs"]["repetitions"], 1)

    def test_get_stats_route_returns_phase3_summary(self):
        database.creer_capture(
            database.CommandeCreationCapture(
                phrase_originale="see you soon",
                traduction="a bientot",
                audio_url="/stockage/audios/soon.wav",
                contexte_tags=["voyage", "salutation"],
                formalite="standard",
                latitude=48.8567,
                longitude=2.3523,
                langue="en",
                pipeline_ia=database.PipelineIA(
                    transcription=database.StatutEtapeIA(statut="ok", modele="base"),
                    analyse=database.StatutEtapeIA(statut="ok", modele="llama3"),
                ),
            ),
            self.__class__.database_url,
        )
        database.noter_revision_capture(
            "00000000-0000-0000-0000-000000000001",
            5,
            self.__class__.database_url,
        )
        date_derniere_revision = datetime.now(timezone.utc).isoformat()
        with database.connecter_base(self.__class__.database_url) as connexion:
            connexion.execute(
                database.adapter_requete(
                    "UPDATE captures SET prochaine_revision = ?, derniere_revision = ? WHERE id = ?",
                    self.__class__.database_url,
                ),
                [
                    "2026-05-01T09:00:00+00:00",
                    date_derniere_revision,
                    "00000000-0000-0000-0000-000000000001",
                ],
            )
            connexion.commit()

        response = self.request("GET", "/stats")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["total_captures"], 2)
        self.assertEqual(payload["total_phrases_revisees"], 1)
        self.assertEqual(payload["total_revisions_dues"], 1)
        self.assertEqual(payload["total_revisions_a_venir"], 1)
        self.assertEqual(payload["total_revisions_recente"], 1)
        self.assertEqual(payload["tags_dominants"][0]["tag"], "voyage")
        self.assertEqual(payload["tags_dominants"][0]["total"], 2)
        repartition_langues = {
            item["cle"]: item["total"] for item in payload["repartition_langues"]
        }
        repartition_formalites = {
            item["cle"]: item["total"] for item in payload["repartition_formalites"]
        }
        self.assertEqual(repartition_langues["fr"], 1)
        self.assertEqual(repartition_langues["en"], 1)
        self.assertEqual(repartition_formalites["standard"], 2)

    def test_post_review_rejects_invalid_quality(self):
        response = self.request(
            "POST",
            "/captures/00000000-0000-0000-0000-000000000001/review",
            json={"qualite": 8},
        )

        self.assertEqual(response.status_code, 422)

    def request(self, method, url, **kwargs):
        async def _executer():
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=main.app),
                base_url="http://testserver",
            ) as client:
                return await client.request(method, url, **kwargs)

        return anyio.run(_executer)


if __name__ == "__main__":
    unittest.main()
