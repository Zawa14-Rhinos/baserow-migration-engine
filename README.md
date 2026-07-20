# Baserow Migration Engine

Ein generisches, Plugin-basiertes Werkzeug zur Migration von Stammdaten in [Baserow](https://baserow.io). Die Engine selbst enthält keine projekt- oder organisationsspezifische Logik — sie liest Regeln aus einer Konfigurationsdatei und delegiert entitätsspezifische Prüfungen an Plugins.

## Architektur

| Bestandteil | Zweck | Ändert sich |
|---|---|---|
| `migration_engine/` | generische Engine (CSV lesen, Plugin wählen, analysieren, Bericht erzeugen) | selten |
| `plugins/` | eine Datei je Datenquelle/Entität (Spalten, entitätsspezifische Prüfungen) | pro neuer Datenquelle |
| `config/rules.yaml` | maschinenlesbare, bestätigte fachliche Regeln deines Projekts | regelmäßig |
| `knowledge/knowledge.md` | Lessons Learned aus abgeschlossenen Importen | nach jedem Import |
| `docs/` | Methodik: Skill, Workflows (Import/Commit/Post-Import), Roadmap | selten |

`config/rules.yaml`, `config/decision_log.md` und `knowledge/knowledge.md` sind projektspezifisch und per `.gitignore` ausgeschlossen — kopiere die mitgelieferten `*.example.*`-Dateien und fülle sie mit den Regeln deines Projekts. Die Methodik dahinter steht in [`docs/Baserow Migration Assistant.md`](docs/Baserow%20Migration%20Assistant.md).

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Nutzung

```bash
cp config/rules.example.yaml config/rules.yaml   # eigene Regeln eintragen
cp knowledge/knowledge.example.md knowledge/knowledge.md

migration analyze sample_data/sporthallen_sample.csv
```

```
✔ 10 Datensätze
✔ Kodierung: utf-8
✔ alle Pflichtspalten vorhanden
⚠ 1 doppelte Schlüsselwerte in der Quelldatei: H001
⚠ 1 leere Werte in Pflichtspalte 'Externe Hallen-ID'
✔ Adressen mit eindeutigem Hausnummern-Muster: 8/10
⚠ Entität 'sporthallen' ist noch nicht in rules.yaml -> entities hinterlegt (keine Ziel-Tabellen-ID bekannt).

Import möglich.
```

`migration commit` ist bewusst noch nicht implementiert — das ist der nächste Meilenstein (siehe Roadmap).

## Eigenes Plugin ergänzen

Ein Plugin ist ein Modul in `plugins/` mit:

- `ENTITY_NAME: str` — Schlüssel, unter dem die Entität in `rules.yaml -> entities` steht
- `REQUIRED_COLUMNS: list[str]` — Pflichtspalten der Quelldatei
- `DEDUPLICATION_KEY: str | None` — optionale Spalte für die Dublettenprüfung innerhalb der Quelldatei
- `analyze(df, rules) -> dict` — optional, entitätsspezifische Zusatzprüfungen

Siehe [`plugins/sporthallen.py`](plugins/sporthallen.py) als Referenzimplementierung. Die Engine wählt das Plugin automatisch anhand des Dateinamens der Quelldatei.

## Aktueller Stand: MVP (Phase 1 der Roadmap)

Die Engine kann bisher: `rules.yaml` laden, eine CSV einlesen, das passende Plugin wählen, eine Analyse durchführen, einen Qualitätsbericht erzeugen. Es werden noch **keine Daten geschrieben**. Die weiteren Ausbaustufen (Baserow-API, Mapping, Dublettenprüfung, Commit, Beziehungen, Importprotokoll) stehen in [`docs/Roadmap.md`](docs/Roadmap.md).

## Tests

```bash
pytest
```

## Lizenz

MIT, siehe [LICENSE](LICENSE).
