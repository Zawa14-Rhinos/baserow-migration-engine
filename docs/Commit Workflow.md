# Commit Workflow v1.0

## Reihenfolge der Schreibvorgänge
1. Neue oder geänderte Stammdatensätze (z. B. Personen) anlegen/aktualisieren.
2. Abhängige Entitäten anlegen, die auf Stammdaten verweisen.
3. Beziehungen zwischen Entitäten herstellen.
4. Importprotokoll schreiben.

Schreibvorgänge erfolgen ausschließlich in dieser Reihenfolge, um Verweise auf noch nicht existierende Datensätze zu vermeiden.

## Batchstrategie
- Datensätze werden in festen Batches statt einzeln geschrieben (siehe `config/rules.yaml` → `import.batch_size`).
- Jeder Batch wird vor der Ausführung gegen die freigegebene Importvorschau validiert.
- Ein Batch wird erst gestartet, wenn der vorherige vollständig abgeschlossen ist.

## Fehlerbehandlung
- Fehler innerhalb eines Batches führen zum Abbruch dieses Batches, nicht des gesamten Imports.
- Bereits erfolgreich geschriebene Batches bleiben bestehen.
- Fehlerhafte Datensätze werden mit Fehlerursache erfasst und nicht automatisch erneut versucht.

## Rollback-Verhalten
- Es erfolgt kein automatischer Rollback bereits geschriebener Batches.
- Ein Rückgängigmachen bereits committeter Daten erfordert eine explizite, separate Entscheidung und Ausführung.
- Fehlgeschlagene, nicht geschriebene Datensätze werden erneut in den Import Workflow zurückgeführt.

## Importprotokoll
- Für jeden Importlauf wird ein Protokolleintrag erzeugt.
- Der Eintrag enthält: Quelle, Umfang, angewandte Regeln, Ergebnis je Batch, aufgetretene Fehler, Zeitpunkt.
- Der Eintrag enthält ausschließlich technische Prozessinformationen, keine personenbezogenen Datenwerte.

## Abschlusskontrolle
- Nach Abschluss aller Batches wird die Anzahl geschriebener gegenüber freigegebener Datensätze abgeglichen.
- Abweichungen werden dokumentiert und lösen eine gezielte Rückfrage aus, sofern sie nicht durch bereits erfasste Fehler erklärt sind.
- Erst nach erfolgreicher Abschlusskontrolle gilt der Import als abgeschlossen und der Post Import Workflow wird angestoßen.
