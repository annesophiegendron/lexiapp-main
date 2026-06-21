from datetime import datetime, timezone
import unittest

try:
    from backend.phase3 import EtatSRS, calculer_revision_sm2
except ModuleNotFoundError:
    from phase3 import EtatSRS, calculer_revision_sm2


class Phase3SrsTests(unittest.TestCase):
    def test_premiere_reussite_planifie_a_j1(self):
        base = datetime(2026, 5, 19, tzinfo=timezone.utc)

        resultat = calculer_revision_sm2(qualite=5, maintenant=base)

        self.assertEqual(resultat.repetitions, 1)
        self.assertEqual(resultat.intervalle_jours, 1)
        self.assertEqual(resultat.prochaine_revision, datetime(2026, 5, 20, tzinfo=timezone.utc))

    def test_deuxieme_reussite_planifie_a_j6(self):
        base = datetime(2026, 5, 19, tzinfo=timezone.utc)
        etat = EtatSRS(repetitions=1, intervalle_jours=1, facteur_aisance=2.5)

        resultat = calculer_revision_sm2(qualite=4, etat=etat, maintenant=base)

        self.assertEqual(resultat.repetitions, 2)
        self.assertEqual(resultat.intervalle_jours, 6)
        self.assertEqual(resultat.prochaine_revision, datetime(2026, 5, 25, tzinfo=timezone.utc))

    def test_echec_reinitialise_la_progression(self):
        base = datetime(2026, 5, 19, tzinfo=timezone.utc)
        etat = EtatSRS(repetitions=3, intervalle_jours=14, facteur_aisance=2.3)

        resultat = calculer_revision_sm2(qualite=2, etat=etat, maintenant=base)

        self.assertEqual(resultat.repetitions, 0)
        self.assertEqual(resultat.intervalle_jours, 1)
        self.assertEqual(resultat.prochaine_revision, datetime(2026, 5, 20, tzinfo=timezone.utc))
        self.assertGreaterEqual(resultat.facteur_aisance, 1.3)


if __name__ == "__main__":
    unittest.main()
