import unittest

from fastapi.testclient import TestClient

import main
class MainApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(main.app)

    def test_health_route(self):
        response = self.client.get("/sante")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

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
        self.assertEqual(payload["capture"]["audio_url"], "/stockage/audios/test.wav")

    def test_post_captures_rejects_non_audio(self):
        response = self.client.post(
            "/captures",
            files={"audio": ("test.txt", b"hello", "text/plain")},
            data={"latitude": "48.8566", "longitude": "2.3522", "langue": "fr"}, # les données de lat et long  doivent etre mises sinon j'ai une erreur 
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Le fichier envoye doit etre un audio valide.")


if __name__ == "__main__":
    unittest.main()
