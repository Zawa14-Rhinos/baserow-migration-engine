# Schiedsrichterkosten-Rechner — Analyse, Prozessgrenzen und Version 1.1

Vorarbeit zu einer Weiterentwicklung. Kein Umsetzungsplan für eine neue Anwendung, sondern die
Frage, was der Rechner künftig tragen soll und was ausdrücklich nicht. Grundlage ist der Stand vom
22.08.2026 (`tools/schiedsrichter-rechner/index.html`, 1103 Zeilen, eine Datei, kein Server).

Annahmen sind als **Annahme** gekennzeichnet, offene Entscheidungen am Ende gesammelt.

## 1 · Rolle des Rechners

Die Kette vom Spiel bis zum Archiv hat sieben Glieder. Der Rechner deckt heute dreieinhalb davon ab.

| Glied | Heute im Rechner | Künftig im Rechner | Begründung |
|---|---|---|---|
| **Berechnung** | ja | ja — hier gehört sie hin | Braucht kein Netz, keine Identität, kein Gedächtnis. Reine Funktion aus Spielklasse, Lizenzstufe und Kilometern. |
| **Dokument** | ja (PDF über Drucken) | ja | Das PDF ist der Beleg. Es muss auf jedem Gerät ohne Netz entstehen können. |
| **Bestätigung** | ja (Unterschrift im Feld) | ja | Muss am Ort und im Moment der Auszahlung passieren, sonst ist sie wertlos. |
| **Einreichung** | halb (Mail mit Anhang) | ja, aber nur der Anstoß | Der Rechner darf einen Vorgang übergeben. Er darf nicht dafür verantwortlich sein, dass er ankommt. |
| **Prüfung** | nein | **nein** | Vier-Augen-Prinzip. Wer prüft, darf nicht dasselbe Werkzeug benutzen wie der, der einreicht. |
| **Zahlung** | nein | **nein** | Erstattung und Auszahlung sind Kassenvorgänge und gehören in die Buchhaltung. |
| **Archivierung** | nein | **nein** | Aufbewahrungsfristen laufen über Jahre. Ein Browserspeicher auf einem Privatgerät ist kein Archiv. |

Der Trennstrich liegt zwischen **Einreichung** und **Prüfung**, und er ergibt sich nicht aus
Bequemlichkeit, sondern aus drei Eigenschaften des Geräts, auf dem der Rechner läuft: Es gehört
einer Privatperson, es hat kein Backup, und es kennt keine Zugriffsrechte. Alles, was einen
Nachweis über den Spieltag hinaus tragen muss, gehört woandershin.

Eine Grauzone bleibt: Der Trainer möchte sehen, ob er sein Geld zurückbekommen hat. Dieser Status
darf im Rechner **angezeigt**, aber niemals dort **geführt** werden — er entsteht in der
Buchhaltung. Bis es eine Rückrichtung gibt, endet die Anzeige bei „eingereicht".

## 2 · Datenmodell eines Abrechnungsvorgangs

**Die Abrechnungseinheit ist das Spiel** (Annahme, siehe offene Entscheidungen). Nicht der
Schiedsrichter, denn zwei Schiedsrichter eines Spiels werden gemeinsam bezahlt und gemeinsam
gebucht. Nicht der Spieltag, denn die Kosten gehören der Mannschaft, und bei einer Doppelansetzung
sind das zwei verschiedene.

**Kopf**

| Feld | Warum es gebraucht wird |
|---|---|
| `abrechnung_id` | Fachlicher Schlüssel, im Rechner erzeugt, erscheint auf dem PDF. Trägt die Deduplizierung. |
| `abgeschlossen_am` | Zeitpunkt, ab dem der Vorgang unveränderlich ist |
| `spiel_datum`, `spiel_nr`, `liga`, `team`, `halle` | als **Textkopie**, nicht als Verweis — der Beleg muss auch dann noch lesbar sein, wenn der Spielplan sich ändert |
| `spiel_ref` | optionaler Verweis auf den Spielplan-Datensatz, wenn das Spiel von dort kam |
| `tarif_stand` | z. B. „SRO 06/2026". Ohne diese Angabe lässt sich eine alte Abrechnung nie wieder nachrechnen. |
| `zahlungsart` | bar durch Trainer · bar aus Spieltagskasse · Überweisung Verein · über Verband |
| `ausgelegt_von` | Name der Person, die das Geld vorgestreckt hat |
| `summe_gebuehr`, `summe_fahrt`, `summe_gesamt` | eingefroren in **Cent als Ganzzahl** |
| `status_lokal` | offen · abgeschlossen · übertragen — mehr kennt der Rechner nicht |

**Positionen, je Schiedsrichter eine**

`name`, `lizenzstufe`, `gebuehr`, `km`, `fahrtkosten`, `betrag`, `verdoppelt`, `folgespiel`.

**Was bewusst nicht hineingehört**

- **Die Unterschrift.** Sie ist ein personenbezogenes Merkmal mit hohem Missbrauchswert. Auf dem
  PDF ist sie Beleg, in einer Datenbank ist sie ein Risiko ohne Zusatznutzen. Im Datensatz genügt
  `unterschrift_vorhanden` als Ja/Nein.
- **Die Anschrift.** Der Rechner speichert sie heute lokal, zeigt aber nur die PLZ. Für die
  Übertragung ist selbst die PLZ verzichtbar: Nachvollziehbar ist die Fahrtkostenzeile schon über
  die Kilometerzahl. **Vorschlag:** PLZ auf dem Papierbeleg belassen, nicht mit übertragen.
- **Die IBAN der Schiedsrichter.** Solange bar gezahlt wird, gibt es keinen Grund, sie überhaupt zu
  erheben.
- **Die IBAN des Auslegenden.** Sie ist Stammdatum einer Person, kein Merkmal eines Spiels. In
  jedem Vorgang mitzuführen vervielfacht sie ohne Nutzen. Sie gehört einmal in die Vereinsdaten.
- **Der auf 5 € aufgerundete Bargeldbetrag.** Das ist eine Anzeigehilfe fürs Portemonnaie, kein
  Wert, der je in einen Vorgang oder eine Buchung geraten darf.

## 3 · Kandidaten für die Weiterentwicklung

Bewertet ist jeweils, was die Funktion **heute** bringt, was sie **später** trägt, was sie kostet
und woran sie hängt.

| Funktion | Nutzen heute | Nutzen später | Aufwand | Abhängigkeit / Risiko | Für 1.1 |
|---|---|---|---|---|---|
| Abrechnungs-ID | gering — eine Nummer auf dem Beleg | hoch — Schlüssel für Dedup und Rückfragen | klein | keine | **ja** |
| Abrechnung vs. Quittung trennen | mittel — klärt, was der SR bekommt und was der Verein | hoch — zwei Dokumente mit verschiedenen Empfängern | klein | keine | **ja** |
| Zahlungsart erfassen | gering | hoch — jedes Zielmodell braucht sie | klein | keine | **ja** |
| Vorgang lokal ablegen + Liste | hoch — beendet die Rückfragen | mittel | mittel | Browserspeicher ist flüchtig | **ja** |
| Schutz vor Doppel-Einreichung | gering | hoch | klein | braucht die ID | **ja** |
| Tarifstand auf den Beleg | gering | hoch — Reproduzierbarkeit | sehr klein | keine | **ja** |
| Beträge intern in Cent | unsichtbar | hoch — keine Rundungsdifferenzen bei Summen | klein | Umbau der Rechenwege | **ja, intern** |
| Übertragung an Baserow | keiner | hoch | mittel | Tabelle, Formular, Feldnamen | nein |
| Spielplan als eigene Datei | keiner | hoch | mittel | Auslieferungsweg | nein |
| Service Worker / PWA | mittel | mittel | hoch | eigener Hosting-Ort nötig | nein |

## 4 · Offline zuerst

Wichtige Unterscheidung: Der Rechner ist heute **offline betriebsfähig**, aber nicht **offline
startfähig**. Läuft er einmal, braucht er kein Netz — alles ist in der Datei. Ist die Seite aber
noch nicht geladen und es gibt keinen Empfang, sieht der Trainer nichts.

Drei Wege, in aufsteigender Komplexität:

1. **Datei auf dem Gerät.** Einmal herunterladen, auf den Startbildschirm legen, fertig. Kostet
   nichts, funktioniert sofort und vollständig. Nachteil: Aktualisierungen muss jeder selbst holen
   — bei einem Werkzeug mit Spielplan-Daten ein echter Nachteil, aber ein beherrschbarer, solange
   der Spielplan-Stand sichtbar in der Fußzeile steht.
2. **Progressive Web App** mit Service Worker und Manifest. Installierbar, aktualisiert sich
   selbst. Setzt einen eigenen, dauerhaften Hosting-Ort mit eigenem Pfad voraus. **Hinweis:** Der
   Code enthält bereits einen Höhen-Melder für die Einbettung per iframe (Zeile 1097) — vermutlich
   für TYPO3 gedacht. In einem iframe funktioniert eine PWA-Installation nicht. Beides zusammen
   geht nicht; das ist eine Wegentscheidung, keine Detailfrage.
3. **Echte Synchronisation** mit Warteschlange, Wiederholversuchen und Konfliktauflösung. Für einen
   ehrenamtlich betriebenen Rechner die falsche Größenordnung.

**Empfehlung:** Weg 1 sofort, Weg 2 erst, wenn ein eigener Hosting-Ort feststeht. Weg 3 nie.

Statt „Synchronisation" das kleinere Konzept: **einmal abschließen, später absenden**. Der Vorgang
wird lokal eingefroren, das Absenden ist ein bewusster Knopfdruck, und die Abrechnungs-ID sorgt
dafür, dass ein zweites Absenden desselben Vorgangs erkennbar bleibt. Kein Hintergrundprozess, kein
Zustand, den niemand mehr versteht.

Zur Speichergröße: Ein Vorgang ohne Unterschrift ist ein bis zwei Kilobyte, das übliche Limit liegt
bei fünf Megabyte — die Menge ist auf Jahre unkritisch. Unterschriften als Bild wären mit 20 bis 50
Kilobyte je Stück etwas anderes; ein weiterer Grund, sie nur ins PDF zu geben.

## 5 · Baserow als nächste Ebene

Baserow übernimmt, was der Rechner nicht darf: Sammeln, Prüfen, Zahlungssteuerung, Archiv. Die
Struktur dafür existiert bereits — `Spiele`, `Spielbesetzungen` mit der Rolle Schiedsrichter,
`Schiedsrichterprofile`, `Kostenstellen`, `Buchungen` mit der Kategorie „Schiedsrichter &
Kampfgericht". Es fehlt eine Tabelle für den Abrechnungsvorgang.

Vier denkbare Verbindungen:

| Verbindung | Bewertung |
|---|---|
| Mail mit PDF-Anhang (heute) | Keine Kopplung, kein Risiko, aber auch keine Struktur. Bleibt als Rückfallweg. |
| **Formularansicht mit vorausgefüllten Feldern** | Kein Schlüssel, keine Anmeldung, Dateianhang möglich. Der Rechner baut einen Link, der Trainer tippt auf Absenden. **Empfohlen.** |
| API mit Datenbank-Token im Browser | Auch ein auf Anlegen beschränkter Token ist ein Schreibzugang für jeden, der die Seite öffnet. Bei einer öffentlich erreichbaren Seite nicht vertretbar. |
| Eigener Server als Vermittler | Löst das Schlüsselproblem sauber, verlangt aber dauerhaften Betrieb. Widerspricht der Randbedingung. |

**Annahme, die vor dem Bau zu prüfen ist:** dass Baserow-Formularansichten das Vorbefüllen von
Feldern über die Adresszeile unterstützen. Trifft das nicht zu, bleibt der Mailweg, und der Rest
der Architektur ändert sich nicht — genau deshalb steht die Übertragung nicht in Version 1.1.

Zwei weitere offene Punkte: ob Baserow die Abrechnungs-ID technisch eindeutig halten kann oder ob
die Dublettenprüfung über eine Ansicht laufen muss, und wie die Lizenzstufen abgebildet werden —
der Rechner kennt LSE, LSD und LSC, die `Schiedsrichterprofile` kennen Vereinsschiedsrichter, D, C,
B, A und DBB.

## 6 · Vorschlag für Version 1.1

Ziel: Der heutige Ablauf bleibt vollständig erhalten. Wer die neuen Funktionen ignoriert, merkt
keinen Unterschied.

**Neue Funktionen**

1. **Abschließen.** Ein Knopf unter der Quittung erzeugt die Abrechnungs-ID im Format
   `SR-20260905-9606-A7F3` (Datum, Spielnummer, vier Zufallszeichen — eindeutig ohne zentrale
   Vergabe), friert die Beträge ein und legt den Vorgang lokal ab.
2. **Zahlungsart** als Auswahl beim Abschließen: bar durch mich · bar aus der Spieltagskasse · noch
   offen.
3. **Meine Abrechnungen** — ein Aufklappbereich wie die vorhandenen, mit Datum, Mannschaft, Betrag
   und Status, dazu „als eingereicht markieren" von Hand, solange die Einreichung per Mail läuft.
4. **Doppelschutz.** Ein abgeschlossener Vorgang lässt sich nicht stillschweigend erneut anlegen;
   für dasselbe Spiel am selben Tag erscheint ein Hinweis statt einer zweiten Abrechnung.
5. **Abrechnungs-ID und Tarifstand auf dem PDF**, damit Beleg und Vorgang zusammenfinden.

**Oberfläche**

Ein fünfter Schritt „Abschließen" unter Schritt 4, in derselben Kartenform. Ein weiterer
`details`-Block „Meine Abrechnungen" neben den bestehenden. Sonst nichts — keine neue Navigation,
keine zweite Seite.

**Daten**

Ein neuer Speicherschlüssel `usv-sr-vorgaenge` mit Schema-Version, damit spätere Änderungen die
alten Einträge nicht unlesbar machen. Die bestehenden fünf Schlüssel bleiben unverändert.

**Ausdrücklich nicht in 1.1**

Keine Baserow-Anbindung, kein Service Worker, keine Anmeldung, kein Abgleich zwischen Geräten, keine
Änderung an den Rechenwegen, kein Speichern von Unterschriften, keine IBAN-Pflicht.

**Betroffene Dateien**

`tools/schiedsrichter-rechner/index.html` (die einzige Programmdatei),
`docs/Schiedsrichterkosten-Rechner.md` (Abschnitte zu Vorgängen und lokalem Speicher), neu
voraussichtlich `docs/Datenmodell Abrechnungsvorgang.md`.

## Was im Bestand später stört

Fünf Punkte, die heute funktionieren, aber einer späteren Architektur im Weg stehen:

1. **Die Gebührensätze stehen an zwei Stellen.** Jedes Spiel im Datensatz trägt eigene Werte
   (`lse`, `lsd`, Zeile 369), daneben gibt es die Tarifmatrix für frei erfasste Spiele (`ERW_TARIF`,
   Zeile 911). Ändert der Verband einen Satz, müssen beide angefasst werden — und niemand merkt es,
   wenn nur eine Stelle geändert wurde. Zusammenführen zu einer Tarifmatrix mit Gültigkeitsdatum,
   auf die der Spielplan nur verweist.
2. **Sätze ohne Gültigkeitszeitraum.** Solange ein Satz kein „gilt ab" hat, lässt sich eine
   Abrechnung aus der Vorsaison nicht mehr nachrechnen. Für 1.1 genügt der Tarifstand als Text auf
   dem Beleg; sauber wird es erst mit datierten Sätzen.
3. **Spielplan und Programm in einer Datei.** Jede Spielplanänderung erzwingt eine neue
   Veröffentlichung des gesamten Werkzeugs. Perspektivisch: Daten getrennt, erzeugt aus der
   Baserow-Tabelle `Spiele`.
4. **Der Kilometersatz ist eine Konstante im Code** (`KM_SATZ`, Zeile 371) und teilt damit das
   Schicksal der Sätze — er gehört in dieselbe datierte Tarifmatrix.
5. **Unterschriften leben nur im Arbeitsspeicher** (Zeile 803). Ein versehentliches Neuladen der
   Seite löscht sie, ohne Warnung. Sobald es einen abgeschlossenen Vorgang gibt, muss klar sein:
   erst PDF sichern, dann alles andere. In 1.1 gehört deshalb eine Warnung beim Verlassen der Seite
   mit nicht gesichertem Vorgang dazu.

## Offene Entscheidungen

| Frage | Warum sie jetzt zählt |
|---|---|
| Ist die Abrechnungseinheit wirklich das Spiel? | Bestimmt das gesamte Datenmodell. Bei Spieltagskasse wäre auch der Spieltag denkbar — dann aber ohne saubere Zuordnung zur Mannschaft. |
| Wer gilt als Einreicher, wenn die Spieltagskasse zahlt? | Entscheidet, wessen Name und wessen Konto in den Vorgang gehören. |
| Reicht eine im Feld gezeichnete Unterschrift auf einem PDF als Beleg? | Sollte die Kassenprüfung einmal bestätigen, bevor der Papierweg abgeschafft wird. |
| Wie lange werden die Belege aufbewahrt, und wo? | Bestimmt, ob Baserow Archiv sein kann oder nur Durchgangsstation. |
| Bleibt die Einbettung per iframe (TYPO3) das Ziel? | Schließt die PWA aus. Beides zusammen geht nicht. |
| Gilt die Barzahlung vor Spielbeginn zwingend? | Noch ungeprüft — bvsa.de ist aus der Entwicklungsumgebung nicht erreichbar. Entscheidet, ob bargeldlose Modelle überhaupt zur Wahl stehen. |
