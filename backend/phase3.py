from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class EtatSRS:
    repetitions: int = 0
    intervalle_jours: int = 0
    facteur_aisance: float = 2.5
    prochaine_revision: datetime | None = None


def borner_qualite(qualite: int) -> int:
    return max(0, min(5, qualite))


def calculer_revision_sm2(
    qualite: int,
    etat: EtatSRS | None = None,
    maintenant: datetime | None = None,
) -> EtatSRS:
    # Version minimale de SM-2 pour initialiser la phase 3 sans encore toucher aux routes.
    qualite = borner_qualite(qualite)
    etat_courant = etat or EtatSRS()
    reference = maintenant or datetime.now(timezone.utc)

    repetitions = etat_courant.repetitions
    intervalle = etat_courant.intervalle_jours
    facteur = etat_courant.facteur_aisance

    if qualite < 3:
        repetitions = 0
        intervalle = 1
    else:
        if repetitions == 0:
            intervalle = 1
        elif repetitions == 1:
            intervalle = 6
        else:
            intervalle = max(1, round(intervalle * facteur))
        repetitions += 1

    facteur = max(
        1.3,
        facteur + (0.1 - (5 - qualite) * (0.08 + (5 - qualite) * 0.02)),
    )

    return EtatSRS(
        repetitions=repetitions,
        intervalle_jours=intervalle,
        facteur_aisance=round(facteur, 2),
        prochaine_revision=reference + timedelta(days=intervalle),
    )
