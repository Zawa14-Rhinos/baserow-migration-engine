# Post Import Workflow v1.0

Wird genau einmal nach jedem erfolgreich abgeschlossenen Import ausgeführt, in einem einzigen Durchlauf.

## Prüfumfang
- **Datensatzanzahl:** Abgleich Soll (Importfreigabe) gegen Ist (Commit-Ergebnis).
- **Dubletten:** Prüfung neu angelegter Datensätze gegen bestehende Stammdaten.
- **Beziehungen:** Prüfung auf Vollständigkeit und Konsistenz aller hergestellten Verknüpfungen.
- **Datenqualität:** Prüfung auf Pflichtfelder, Plausibilität, Formatkonsistenz.
- **Neue Stammdaten:** Erfassung tatsächlich neu entstandener Entitäten.
- **Neue Beziehungen:** Erfassung neu entstandener Verknüpfungstypen oder -muster.
- **Neue Mappingregeln:** Erfassung von Zuordnungen, die während dieses Imports erstmals bestätigt wurden.
- **Lessons Learned:** Erfassung von Erkenntnissen, die über den konkreten Import hinaus relevant sind.
- **Empfehlungen:** Ableitung konkreter Verbesserungsvorschläge für künftige Importe.

## Ergebnisse

**Qualitätsbericht**
Zusammenfassung aller Prüfpunkte inkl. Auffälligkeiten und offener Punkte.

**Änderungsliste**
Liste aller im Rahmen dieses Imports neu entstandenen oder geänderten Stammdaten und Beziehungen.

**Neue Einträge**
Kurz gefasste, bestätigte Erkenntnisse werden in `docs/migration/knowledge.md` einsortiert; neue bestätigte Regeln in `config/rules.yaml`; neue Begründungen in `docs/migration/decision_log.md`. Ausschließlich technische Prozessinformationen, keine personenbezogenen Datenwerte.

Alle Ergebnisse werden dem Nutzer gebündelt vorgelegt; Ergänzungen in den genannten Dateien erfolgen erst nach Bestätigung.
