# Import Workflow v1.0

## Schritt 1 – Quelldatei entgegennehmen
**Ziel:** Quelldatei als Ausgangspunkt der Migration erfassen.
**Eingaben:** Quelldatei, Kontext zur Herkunft.
**Aktionen:** Struktur und Umfang der Quelldatei sichten.
**Ergebnisse:** Bestätigter Ausgangsdatensatz für die Analyse.

## Schritt 2 – Analyse
**Ziel:** Inhalt, Struktur und Auffälligkeiten der Quelldaten verstehen.
**Eingaben:** Quelldatei.
**Aktionen:** Felder, Wertebereiche, fehlende Angaben und Unregelmäßigkeiten identifizieren.
**Ergebnisse:** Analyseergebnis inklusive Liste erkannter Auffälligkeiten.

## Schritt 3 – Mapping
**Ziel:** Quellfelder auf Zielstruktur (führende Zieldatenbank) abbilden.
**Eingaben:** Analyseergebnis, bestehende Regeln aus `config/rules.yaml`.
**Aktionen:** Felder gemäß bestätigter Regeln zuordnen; Fälle ohne Regel markieren.
**Ergebnisse:** Mappingtabelle inkl. offener Zuordnungsfälle.

## Schritt 4 – Stammdatenableitung
**Ziel:** Zielkonforme Stammdatensätze ableiten.
**Eingaben:** Mappingtabelle, bestehende Stammdaten aus der führenden Zieldatenbank.
**Aktionen:** Datensätze in Zielform überführen; Abgleich gegen vorhandene Stammdaten auf mögliche Dubletten.
**Ergebnisse:** Vorläufige Zieldatensätze inkl. Dublettenkandidaten.

## Schritt 5 – Vorschau
**Ziel:** Vollständige, prüfbare Übersicht des geplanten Imports erstellen.
**Eingaben:** Vorläufige Zieldatensätze, Dublettenkandidaten, offene Mappingfälle.
**Aktionen:** Vorschau bündeln (neue Datensätze, Änderungen, Konflikte, offene Fälle).
**Ergebnisse:** Konsolidierte Importvorschau.

## Schritt 6 – Offene Entscheidungen sammeln
**Ziel:** Alle Punkte ohne bestätigte Regel an einer Stelle zusammenführen.
**Eingaben:** Offene Mappingfälle, Dublettenkandidaten, sonstige Auffälligkeiten aus Schritt 2–5.
**Aktionen:** Offene Punkte konsolidieren und priorisieren.
**Ergebnisse:** Liste offener Entscheidungen.

## Schritt 7 – Rückfrage
**Ziel:** Freigabe des Imports durch fachliche Entscheidung ermöglichen.
**Eingaben:** Importvorschau, Liste offener Entscheidungen.
**Aktionen:** Genau eine gebündelte Rückfrage mit konkreten Optionen stellen.
**Ergebnisse:** Bestätigte Antworten zu allen offenen Punkten.

## Schritt 8 – Importfreigabe
**Ziel:** Übergang zum Commit Workflow ermöglichen.
**Eingaben:** Bestätigte Importvorschau, bestätigte Entscheidungen.
**Aktionen:** Vorschau final mit Bestätigungen abgleichen.
**Ergebnisse:** Freigegebener Importstand.
