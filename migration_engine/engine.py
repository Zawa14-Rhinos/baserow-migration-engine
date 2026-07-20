import importlib
import pkgutil
import re
from pathlib import Path
from types import ModuleType

import plugins
from migration_engine.importer import read_source_file
from migration_engine.quality import AnalysisReport, analyze
from migration_engine.utils import load_yaml

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _normalize(name: str) -> str:
    return _NON_ALNUM.sub("", name.lower())


def discover_plugins() -> dict[str, ModuleType]:
    """Load every plugin module in the `plugins` package, keyed by its ENTITY_NAME."""
    found = {}
    for _, module_name, _ in pkgutil.iter_modules(plugins.__path__):
        module = importlib.import_module(f"plugins.{module_name}")
        entity_name = getattr(module, "ENTITY_NAME", None)
        if entity_name:
            found[entity_name] = module
    return found


def select_plugin(csv_path: Path, available_plugins: dict[str, ModuleType]) -> ModuleType:
    stem = _normalize(csv_path.stem)
    for entity_name, module in available_plugins.items():
        if _normalize(entity_name) == stem:
            return module
    for entity_name, module in available_plugins.items():
        if _normalize(entity_name) in stem:
            return module
    raise ValueError(
        f"Kein passendes Plugin für '{csv_path.name}' gefunden. "
        f"Verfügbare Plugins: {', '.join(available_plugins) or '(keine)'}"
    )


def analyze_file(csv_path: Path, rules_path: Path) -> AnalysisReport:
    rules = load_yaml(rules_path)
    available_plugins = discover_plugins()
    plugin = select_plugin(csv_path, available_plugins)
    source = read_source_file(csv_path)
    return analyze(source, plugin, rules)
