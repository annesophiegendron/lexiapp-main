import unittest

try:
    from backend import preflight_check
except ModuleNotFoundError:
    import preflight_check


class PreflightCheckTests(unittest.TestCase):
    def test_extraire_hote_et_port_postgres_avec_port_explicite(self):
        hote, port = preflight_check.extraire_hote_et_port_postgres(
            "postgresql://postgres:postgres@localhost:5433/lexiapp"
        )

        self.assertEqual(hote, "localhost")
        self.assertEqual(port, 5433)

    def test_extraire_hote_et_port_postgres_avec_port_par_defaut(self):
        hote, port = preflight_check.extraire_hote_et_port_postgres(
            "postgresql://postgres:postgres@db.internal/lexiapp"
        )

        self.assertEqual(hote, "db.internal")
        self.assertEqual(port, 5432)

    def test_extraire_hote_et_port_postgres_refuse_port_invalide(self):
        hote, port = preflight_check.extraire_hote_et_port_postgres(
            "postgresql://postgres:postgres@localhost:not-a-port/lexiapp"
        )

        self.assertIsNone(hote)
        self.assertIsNone(port)

    def test_extraire_hote_et_port_postgres_refuse_url_non_postgres(self):
        hote, port = preflight_check.extraire_hote_et_port_postgres(
            "sqlite:///backend/test.db"
        )

        self.assertIsNone(hote)
        self.assertIsNone(port)

    def test_resumer_preflight_retourne_degraded_si_un_echec_est_present(self):
        resume = preflight_check.resumer_preflight(
            [{"statut": "FAIL", "sujet": "postgresql TCP", "detail": "localhost:5432"}]
        )

        self.assertEqual(resume["status"], "degraded")

    def test_resumer_preflight_retourne_warning_si_aucun_echec_mais_un_warn(self):
        resume = preflight_check.resumer_preflight(
            [{"statut": "WARN", "sujet": "postgresql", "detail": "DATABASE_URL non PostgreSQL"}]
        )

        self.assertEqual(resume["status"], "warning")

    def test_resumer_preflight_retourne_ok_si_aucun_warn_ni_echec(self):
        resume = preflight_check.resumer_preflight(
            [{"statut": "OK", "sujet": "fastapi", "detail": "Framework API disponible"}]
        )

        self.assertEqual(resume["status"], "ok")


if __name__ == "__main__":
    unittest.main()
