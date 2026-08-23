# Schiedsrichterkosten-Rechner

Ein Werkzeug für den Spieltag: Es beantwortet vor dem Spiel die Frage „wie viel Bargeld muss ich
mitnehmen?" und erzeugt nach dem Spiel die unterschriebene Quittung — für Trainer, die auslegen,
und für Schiedsrichter, die ihre eigenen Spiele abrechnen.

- **Veröffentlicht als Artifact:** <https://claude.ai/code/artifact/4390e68c-f2cd-40fd-ac38-e62f9c4a4d37>
- **Quelle:** [`tools/schiedsrichter-rechner/index.html`](../tools/schiedsrichter-rechner/index.html) —
  eine einzelne, in sich geschlossene HTML-Datei ohne externe Abhängigkeiten
- **Rechtliche Grundlage der Sätze:** BVSA-Schiedsrichterordnung 06/2026, Anlage 1
- **Spielplan-Stand:** 17.08.2026 (im Datensatz als `DATEN.stand` gepflegt)

## Für wen, und was es leistet

| Rolle | Ausgangsfrage | Was der Rechner liefert |
|---|---|---|
| **Trainer** („Ich zahle aus") | Wie viel Bargeld brauche ich, und wie belege ich die Auszahlung? | Betrag je Schiedsrichter, auf 5 € aufgerundet fürs Portemonnaie, plus eine Quittung je Schiedsrichter |
| **Schiedsrichter** („Ich pfeife") | Was steht mir für dieses Spiel zu? | Exakter Betrag und eine Quittung je Spiel, die der Trainer unterschreibt |

Die Rolle wird oben umgeschaltet. Sie ändert nur Beschriftungen, Vorbelegungen und die Zahl der
Eingabeblöcke — gerechnet wird für beide Rollen identisch.

## Ablauf

### Als Trainer

1. **Spiel finden** — Suche nach Spielnummer, Gegner, Team oder Datum. Steht das Spiel nicht im
   Spielplan (Pokal, Turnier, fremde Liga), unter „Spielklasse direkt wählen" Spielebene,
   Altersklasse und Mannschaft angeben. Die **Liga laut Spielplan ist dabei Pflicht** — sie steht
   als Spielklasse auf der Quittung, ohne sie wäre der Beleg keinem Wettbewerb zuzuordnen. Paarung,
   Spielnummer und Halle bleiben freiwillig.
2. **Schiedsrichter erfassen** — Anzahl (zwei oder einer), je Person Name, Lizenzstufe, Anfahrt und
   Kilometer. Namen aus der lokalen Schiedsrichter-Liste füllen Lizenzstufe und PLZ automatisch.
3. **Auszahlen und quittieren** — bar vor Spielbeginn, Quittung im Feld unterschreiben lassen.
4. **Abschließen** — Zahlungsart wählen und festschreiben. Jedes Spiel bekommt eine
   Abrechnungsnummer, die Beträge werden eingefroren, der Vorgang landet in der Liste auf dem
   Gerät. Unterschreiben und Drucken gehen danach weiter, die Erfassung ist gesperrt.
5. **Einreichen** — „Drucken / als PDF sichern", dann „Unterschrieben einreichen" (öffnet eine Mail
   an die im Datensatz hinterlegte Vereinsadresse). Für die Rückerstattung IBAN und Kontoinhaber
   eintragen — beides erscheint ausschließlich auf dem eigenen Ausdruck, nicht auf der
   Schiedsrichter-Quittung.

### Als Schiedsrichter

1. Einmalig „Meine Daten als Schiedsrichter" ausfüllen (Name, Lizenzstufe, Wohnanschrift). Bleibt
   auf dem Gerät und belegt danach jedes Spiel automatisch vor.
2. Spiel wählen, Kilometer prüfen, vom Trainer unterschreiben lassen, als PDF sichern.
3. Zweites Spiel am selben Tag: „Weiteres Spiel am selben Tag" — siehe unten.

### Doppelansetzung (zwei Spiele hintereinander)

Jedes Spiel wird einzeln abgerechnet und braucht seine eigene Quittung. „Weiteres Spiel am selben
Tag" schließt das aktuelle Spiel ab und legt das nächste an:

- Name, Lizenzstufe und Adresse bleiben stehen,
- die Fahrtkosten setzt der Rechner beim zweiten Spiel in derselben Halle automatisch auf null
  (Fahrtkosten gibt es nur einmal pro Anfahrt),
- alle Quittungen des Tages werden in einem einzigen PDF gedruckt,
- der Summenbalken zeigt die Gesamtsumme über alle gesammelten Spiele.

Ein gesammeltes Spiel lässt sich über „entfernen" wieder herausnehmen.

## Gebührenlogik

**Spielleitungsgebühr** — hängt an Spielklasse und Lizenzstufe des einzelnen Schiedsrichters. Beide
Schiedsrichter eines Spiels können unterschiedlich eingestuft sein; jeder wird nach seiner eigenen
Lizenz bezahlt.

Die Stufe liegt in den meisten Ligen zwischen LSE und LSD („LSE-Satz" / „LSD oder höher"). In der
**Oberliga Herren** liegt sie eine Stufe höher: LSE und LSD erhalten 35 €, erst ab LSC 45 €. Der
Rechner blendet dort automatisch eine dritte Auswahl ein. Gesteuert wird das über die Liste
`LSC_STUFE` im Quelltext.

**Verdopplung bei nur einem Schiedsrichter** — ist nur einer angesetzt, wird die Gebühr verdoppelt.
Ausgenommen sind U11/U12 und YSO; dort bleibt es beim einfachen Satz. Deshalb ist die Altersklasse
bei der freien Erfassung ein eigenes Feld: Eine gemeinsame Auswahl für „Jugend" würde mU17 und mU12
in denselben Topf werfen, obwohl sie sich in genau dieser Regel unterscheiden.

**Fahrtkosten** — 0,30 €/km, Route Wohnort → Halle → Wohnort laut Google Maps, kürzeste Strecke.
Wer direkt davor schon in derselben Halle gepfiffen hat, bekommt für das Folgespiel keine
Fahrtkosten mehr.

**Tagegeld** — erst ab 8 Stunden Abwesenheit, bei einem normalen Heimspiel also nicht.

**Kürzung** — erscheint ein Schiedsrichter nicht 20 Minuten vor Anwurf in Schiedsrichterkleidung in
der Halle, darf die Gebühr um 50 % gekürzt werden. Der Rechner rechnet das nicht automatisch; der
Hinweis steht unter „Was du an der Halle beachten musst".

**Rundung** — in der Trainer-Sicht wird die Gesamtsumme auf volle 5 € aufgerundet angezeigt, damit
das Bargeld reicht. Auf der Quittung steht immer der centgenaue Betrag.

### Freie Erfassung: hinterlegte Sätze

| Spielebene | Altersklasse / Mannschaft | LSE | LSD | LSC+ | Verdopplung bei einem SR |
|---|---|---|---|---|---|
| Jugend, Landes-/Oberliga-Ebene (inkl. YSO) | U13–U20 | 20 | 25 | 25 | ja |
| Jugend, Bezirks-/Territorialebene | U13–U20 | 19 | 25 | 25 | ja |
| Jugend, Mitteldeutsche Liga (MDL) | U13–U20 | 19 | 25 | 25 | ja |
| Jugend, alle Ebenen | U11 / U12 | 19 | 25 | 25 | nein |
| Jugend, alle Ebenen | U10 und jünger | — | — | — | keine Gebühr |
| Bezirksliga | Herren / Damen | 20 / 15 | 25 / 20 | wie LSD | ja |
| Landesliga | Herren / Damen | 30 / 15 | 35 / 20 | wie LSD | ja |
| Oberliga | Herren / Damen | 35 / 25 | 35 / 30 | 45 / wie LSD | ja |
| Oberliga Play-offs | Herren | 40 | 50 | wie LSD | ja |
| Seniorenliga / Bestenermittlung | — | 20 | 25 | wie LSD | ja |
| Pokal HF/Finale mit RL-Beteiligung | Herren / Damen | 65 / 35 | 65 / 35 | wie LSD | ja |

Für Kombinationen ohne hinterlegten Satz (z. B. Oberliga Play-offs der Damen) zeigt der Rechner
„Satz unbekannt — bitte beim Sportwart nachfragen", statt einen Wert zu erfinden.

## Verlegte Spiele

Der Spielplan im Rechner ist eine **Momentaufnahme**, keine Verbindung zu TeamSL. Wird ein Spiel
verlegt, merkt der Rechner das nicht von selbst — er zeigt weiter den Termin, der beim letzten
Einpflegen galt. Der maßgebliche Stand steht in der Fußzeile.

Zwei Wege damit umzugehen:

1. **Im Rechner korrigieren.** Unter dem gewählten Spiel „Termin oder Halle stimmt nicht?" öffnen
   und den tatsächlichen Termin eintragen. Das ursprüngliche Datum bleibt als Vermerk erhalten
   („Verlegt, ursprünglich …") und erscheint mit dem Kennzeichen *verlegt* — auf der Quittung steht
   dann der Termin, an dem wirklich gespielt wurde. Die Korrektur gilt nur für diese eine
   Abrechnung; der hinterlegte Spielplan bleibt unangetastet.
2. **Im Datensatz nachziehen**, wenn die Verlegung dauerhaft gilt: Datum und Uhrzeit ändern und
   `verlegtVon` auf das alte Datum setzen. Dann sehen es alle, die den Rechner benutzen.

## Spielplan pflegen

Der Spielplan liegt als JSON-Objekt `DATEN` am Anfang des `<script>`-Blocks in der HTML-Datei.

```js
{
  "stand": "17.08.2026",
  "einreichenMail": "info@usv-halle-basketball.de",
  "spiele": [
    {
      "nr": 9606,                       // Spielnummer, "" wenn noch offen
      "datum": "2026-09-05",            // ISO, steuert Suche und Monatsfilter
      "zeit": "10:00",
      "team": "mU16 III",               // eigene Mannschaft
      "gegner": "USC Leipzig 2",
      "liga": "Bezirksliga Leipzig U16 mnl",
      "halle": "Sporthalle am Holzplatz",
      "adresse": "Holzplatz 6 06110 Halle",   // Ziel für die Maps-Route
      "lse": 19, "lsd": 25,             // Sätze; optional "lsc" für dreistufige Ligen
      "art": "jugend",                  // jugend | erwachsen | ohne | abschlag
      "einzelDoppelt": true             // Verdopplung bei nur einem Schiedsrichter?
    }
  ]
}
```

Optionale Felder je Spiel: `neu: true` (Halle laut bisheriger Planung, bitte prüfen),
`verlegtVon: "2026-09-05"` (ursprünglicher Termin). `art: "abschlag"` steht für Regionalliga-Spiele,
die über die Abschlagszahlung des Vereins laufen, `art: "ohne"` für Spielrunden ohne Gebühr.

Nach jeder Spielplanänderung `stand` mitziehen — er steht in der Fußzeile und ist für den Nutzer
das einzige Signal, wie aktuell die Daten sind.

## Was auf dem Gerät bleibt

Der Rechner sendet nichts an einen Server; alles läuft im Browser. Lokal gespeichert werden
ausschließlich:

| Schlüssel | Inhalt | Zweck |
|---|---|---|
| `usv-sr-liste` | Name, Lizenzstufe, PLZ der Schiedsrichter | Autovervollständigung |
| `usv-sr-adr` | Name → Anschrift | Kilometer-Route und Anschrift auf der Quittung |
| `usv-sr-km` | Name + Halle → Kilometer | Vorschlag bei der nächsten Abrechnung |
| `usv-sr-profil` | eigene Daten (Schiedsrichter-Sicht) | Vorbelegung |
| `usv-sr-konto` | IBAN und Kontoinhaber, nur wenn angehakt | Erstattung |
| `usv-sr-vorgaenge` | abgeschlossene Abrechnungen (Schema-Version 1) | Übersicht, was schon eingereicht ist |

**Auf der Quittung steht die vollständige Anschrift des Schiedsrichters.** Die Geschäftsstelle
verlangt sie für die Buchhaltung; eine Quittung ohne Anschrift wird nicht angenommen. Fehlt sie,
weist der Rechner in der Quittung darauf hin und fragt beim Abschließen nach. In den gespeicherten
Abrechnungsvorgang wandert sie trotzdem nicht — dort steht nur, was zum Wiedererkennen nötig ist.

Telefonnummern und E-Mail-Adressen gehören nicht in die Schiedsrichter-Liste. Die IBAN wird nur
gespeichert, wenn „Kontodaten auf diesem Gerät merken" aktiv ist, und steht nur auf dem eigenen
Ausdruck.

## Abrechnungsvorgänge

Seit Version 1.1 kennt der Rechner neben der Quittung den **Vorgang**: eine abgeschlossene
Abrechnung für ein Spiel. Abgerechnet wird je Spiel — nicht je Spieltag und nicht je
Schiedsrichter. Bei einer Doppelansetzung entstehen entsprechend zwei Vorgänge mit zwei Nummern.

**Die Abrechnungsnummer** hat die Form `SR-20260905-9606-A7F3`: Spieldatum, Spielnummer und vier
Zufallszeichen. Sie entsteht ohne zentrale Vergabe und bleibt trotzdem eindeutig, auch wenn mehrere
Trainer gleichzeitig abrechnen. Verwechselbare Zeichen (0/O, 1/I) kommen nicht vor. Sie steht auf
der Quittung und ist der Schlüssel für jede Rückfrage.

**Gespeichert wird bewusst wenig:** Spiel, Liga, Halle, Datum, Zahlungsart, je Schiedsrichter Name,
Lizenzstufe, Gebühr, Kilometer und Betrag, dazu die Summen. Nicht gespeichert werden die Anschrift,
die Unterschrift und alle Kontodaten — sie stehen auf dem PDF, und das PDF ist der Beleg.

**Beträge werden in Cent als Ganzzahl geführt.** Das vermeidet Rundungsdifferenzen, wenn mehrere
Positionen summiert werden. Der auf volle 5 € aufgerundete Betrag in der Trainer-Sicht ist eine
Anzeigehilfe fürs Portemonnaie und wird nirgends gespeichert.

**Doppelschutz:** Gibt es für dasselbe Spiel schon eine Abrechnung, fragt der Rechner nach, bevor
eine zweite entsteht — verhindern kann und soll er es nicht, denn eine Korrekturabrechnung muss
möglich bleiben.

Die Liste „Meine Abrechnungen" ist **kein Beleg**, sondern eine Gedächtnisstütze. Sie liegt im
Browserspeicher und ist mit den Websitedaten verschwunden. Deshalb warnt der Rechner beim
Verlassen der Seite, wenn unterschrieben, aber noch nicht gedruckt wurde.

## Ausgabe und Weitergabe

„Drucken / als PDF sichern" erzeugt ein PDF mit allen Quittungen des Tages und — falls ausgefüllt —
einem Erstattungsblock mit IBAN und Gesamtbetrag. Suchfelder, Schaltflächen und Hinweistexte werden
nicht mitgedruckt.

Wer das PDF braucht:

| Empfänger | Wofür | Stand |
|---|---|---|
| Schiedsrichter | eigener Beleg über die erhaltene Zahlung | über „Text kopieren" oder das PDF |
| Trainer / auslegende Person | Nachweis für die Rückerstattung | eigener Ausdruck |
| Verein (USV) | Buchhaltung und Rückerstattung | Mail-Schaltfläche an `einreichenMail` |
| Staffelleiter | in einzelnen Ligen vorgeschrieben | manuell weiterleiten |

Der Einreichungsweg ist bewusst eine Mail mit PDF-Anhang: Er funktioniert ohne Konto, ohne Server
und ohne Absprache mit Dritten. Eine echte Sammelstelle (Eingang, Bestätigung, monatliche
Sammelüberweisung) ist noch nicht festgelegt — siehe „Offene Punkte".

## Offene Punkte

**Fachlich zu bestätigen** (vor dem ersten Saisoneinsatz mit dem Sportwart klären):

1. **Oberliga Herren, Stufe LSC.** Der Rechner nimmt an: LSE und LSD 35 €, ab LSC 45 €. Die Annahme
   stammt aus der Beschriftung der bisherigen Spielklassenliste, nicht aus einem Abgleich mit der
   Ordnung selbst. Trifft sie nicht zu, genügt es, `LSC_STUFE` im Quelltext zu leeren.
2. **Sätze der Mitteldeutschen Liga.** Übernommen aus dem Spielplan-Datensatz (19 / 25). Die MDL ist
   eine Kooperationsliga; ob die BVSA-Sätze dort unverändert gelten, ist nicht belegt.
3. **Oberliga Play-offs der Damen.** Kein Satz hinterlegt.

**Prozess:**

4. **Sammelstelle und Rückerstattung.** Ziel ist: nach dem Spiel abschicken, kurzfristig eine
   Bestätigung erhalten, Rückerstattung gesammelt einmal im Monat. Heute endet der Rechner bei einer
   Mail mit PDF-Anhang; Eingangsbestätigung und Auszahlungslauf sind organisatorisch offen.

**Weiterentwicklung:**

5. **E-Mail-Adressen der Schiedsrichter aus TeamSL** — würde erlauben, die Quittung direkt an den
   Schiedsrichter zu schicken, statt sie ihm zu geben. Setzt einen Zugang und eine Klärung des
   Datenschutzes voraus.
6. **Andere Landesverbände / Regionalliga Nord** — technisch nur eine Frage der Datenpflege: Sätze
   in die Tarifmatrix, Spiele in den Datensatz. Beides gehört dem jeweiligen Verband, nicht dem USV.
7. **Andere Sportarten** — dieselbe Struktur (Spielplan + Satztabelle + Quittung) trägt auch dort;
   auszutauschen sind nur Tarifmatrix und Spielplan.

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 17.08.2026 | Erste Fassung: Spielsuche, Sätze, Kilometer, Quittung mit Unterschrift, Druck und Mail |
| 23.08.2026 | Vollständige Anschrift des Schiedsrichters auf der Quittung statt nur der Postleitzahl; Verlegungen im Rechner eintragbar; MDL-Spiel mU12 gegen ChemCats Chemnitz vom 27.09. auf den 03.10.2026 korrigiert |
| 23.08.2026 | Liga laut Spielplan bei manueller Spieleingabe verpflichtend |
| 23.08.2026 | Version 1.1: Abrechnungsvorgänge mit eigener Nummer, Zahlungsart, Festschreiben der Beträge, Liste der eigenen Abrechnungen auf dem Gerät, Doppelschutz, Abrechnungsnummer und Tarifstand auf der Quittung, Beträge intern in Cent, Warnung vor dem Verlassen mit ungedruckter Unterschrift |
| 22.08.2026 | Schiedsrichter-Sicht mit eigenem Profil; Tagesabrechnung mehrerer Spiele mit automatischem Fahrtkosten-Wegfall; Altersklasse, Spielebene und Mannschaft getrennt wählbar inkl. MDL; dritte Lizenzstufe LSC; IBAN-Feld mit Vierergruppierung und Prüfziffernkontrolle; Anzeigefehler bei „Anfahrt ab" behoben |
