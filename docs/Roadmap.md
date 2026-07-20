# Technische Roadmap – Baserow Migration Engine

Ziel: schrittweiser Übergang von chatbasierter Migration mit Claude Code zu einer eigenständigen Migration Engine, in der ein LLM ausschließlich fachliche Entscheidungen trifft und alle deterministischen Aufgaben durch Python und die Baserow API übernommen werden.

## Phase 1 – Standardisierung

**Ziele**
Stabile, wiederholbare Methodik und Regelbasis schaffen, bevor Automatisierung beginnt.

**Benötigte Komponenten**
Skill (`.claude/skills/baserow-migration-assistant/SKILL.md`), `config/rules.yaml` (fachliche Regeln), `docs/migration/decision_log.md` (Begründungen), `docs/migration/knowledge.md` (Erkenntnisse), Standard-Workflows (Import, Commit, Post-Import).

**Erwarteter Nutzen**
Konsistente Entscheidungen unabhängig vom konkreten Import; belastbare Grundlage für spätere Automatisierung; geringeres Risiko fachlicher Fehlentscheidungen.

**Offene Risiken**
Regelbasis kann zu Projektbeginn unvollständig sein; noch unklare Fälle erzeugen weiterhin häufige Rückfragen; Gefahr, Regeln zu früh als „stabil" zu betrachten.

## Phase 2 – Automatisierung

**Ziele**
Deterministische Teilschritte (Batch-Schreibvorgänge, Validierung, Protokollierung, Dublettenprüfung nach festen Kriterien) in Python auslagern; LLM-Einsatz auf fachliche Entscheidungen und uneindeutige Fälle reduzieren.

**Benötigte Komponenten**
Python-Engine mit Anbindung an Baserow API, maschinenlesbarer `rules.yaml`-Reader, standardisierte Schnittstellen für Analyse-, Mapping- und Commit-Schritte, Protokollierung als strukturierte Daten statt Freitext.

**Erwarteter Nutzen**
Deutlich reduzierter Tool- und Tokenaufwand; höhere Ausführungsgeschwindigkeit; reproduzierbare, testbare Abläufe; LLM wird von Routineaufgaben entlastet.

**Offene Risiken**
Fehlerhafte oder unvollständige Regeln wirken sich jetzt direkt automatisiert aus statt vorab im Chat aufzufallen; Notwendigkeit robuster Validierung vor jedem automatisierten Schreibvorgang; Aufwand für Wartung der Python-Engine.

## Phase 3 – Produktivbetrieb

**Ziele**
Migration Engine als primäres Werkzeug im laufenden Betrieb etablieren; Claude Code nur noch für neue, bislang ungeregelte fachliche Fälle sowie für Weiterentwicklung der Regelbasis einsetzen.

**Benötigte Komponenten**
Stabile, versionierte `rules.yaml`; ausgereifte Python-Engine mit vollständiger Fehlerbehandlung und Rollback-fähigen Abläufen; laufend gepflegte `knowledge.md`/`decision_log.md` als Nachschlagewerk; klar definierte Eskalationswege für neue Regelfälle.

**Erwarteter Nutzen**
Migration läuft weitgehend eigenständig; LLM-Einsatz beschränkt sich auf hochwertige fachliche Entscheidungen; minimaler laufender Aufwand pro Import.

**Offene Risiken**
Schleichende Regelveralterung, wenn neue Sonderfälle nicht konsequent zurück in `rules.yaml`/`knowledge.md` gespiegelt werden; Abhängigkeit von der Stabilität der Baserow API; Notwendigkeit, Vertrauen in automatisierte Entscheidungen laufend durch Stichproben zu verifizieren.
