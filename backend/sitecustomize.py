import os
import sys


def _desactiver_autoload_pytest() -> None:
    if "pytest" not in sys.argv[0].lower() and not any(
        "pytest" in argument.lower() for argument in sys.argv[1:]
    ):
        return

    # Empêche pytest de charger des plugins tiers du site-packages du Python global.
    # Cela évite des conftest externes qui ralentissent ou cassent la collecte.
    os.environ.setdefault("PYTEST_DISABLE_PLUGIN_AUTOLOAD", "1")


_desactiver_autoload_pytest()
