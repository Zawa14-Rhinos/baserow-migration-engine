# Baserow Migration Engine

Ein generisches, Plugin-basiertes Werkzeug zur Migration von Stammdaten in [Baserow](https://baserow.io). Die Engine selbst enthält keine projekt- oder organisationsspezifische Logik — sie liest Regeln aus einer Konfigurationsdatei und delegiert entitätsspezifische Prüfungen an Plugins.

## Architektur

| Bestandteil | Zweck | Ändert sich |
|---|---|---|
| `migration_engine/` | generische Engine (CSV lesen, Plugin wählen, analysieren, Baserow-Schema lesen, Bericht erzeugen) | selten |
| `plugins/` | eine Datei je Datenquelle/Entität (Spalten, entitätsspezifische Prüfungen) | pro neuer Datenquelle |
| `config/rules.yaml` | maschinenlesbare, bestätigte fachliche Regeln deines Projekts | regelmäßig |
| `knowledge/knowledge.md` | Lessons Learned aus abgeschlossenen Importen | nach jedem Import |
| `docs/` | Methodik: Skill, Workflows (Import/Commit/Post-Import), Roadmap | selten |
| `tools/` | eigenständige Werkzeuge ohne Bezug zur Engine, je Werkzeug eine in sich geschlossene HTML-Datei — [Schiedsrichterkosten-Rechner](tools/schiedsrichter-rechner/README.md) ([Fachdoku](docs/Schiedsrichterkosten-Rechner.md), [Kurzanleitung](docs/Kurzanleitung%20Schiedsrichterkosten-Rechner.md)) | selten |

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

## Baserow-Schema lesen (read-only)

`migration schema` verbindet sich mit der Baserow API und liest das komplette Schema einer Datenbank (Tabellen, Felder, Beziehungen) — **ausschließlich lesend, keine Schreibzugriffe**.

Konfiguration erfolgt ausschließlich über Umgebungsvariablen, niemals über Dateien im Repository:

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `BASEROW_API_TOKEN` | ja | API-Token aus Baserow → Einstellungen → API-Tokens |
| `BASEROW_API_URL` | nein | Standard: `https://api.baserow.io`; bei selbstgehosteten Instanzen anpassen |
| `BASEROW_DATABASE_ID` | nein* | Ziel-Datenbank; alternativ `--database-id` beim Aufruf |

\* eine der beiden Quellen (Umgebungsvariable oder `--database-id`) muss die Datenbank-ID liefern.

```bash
export BASEROW_API_TOKEN="..."
export BASEROW_DATABASE_ID=123

migration schema
```

```
✔ Verbindung erfolgreich

12 Tabellen gefunden

10 Kontakte
 • 8 Felder
 • 1 LinkRow-Felder

20 Firmen
 • 6 Felder

...

5 Beziehungen (LinkRow-Verknüpfungen) gefunden
 • Kontakte (10) --[Firma]--> 20
 ...
```

Der Client bricht bei Authentifizierungsfehlern (401/403) und nicht gefundenen Ressourcen (404) sofort ab; bei temporären Fehlern (5xx, 429, Netzwerkfehler) versucht er es mit exponentiellem Backoff automatisch erneut, bevor er endgültig fehlschlägt.

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
