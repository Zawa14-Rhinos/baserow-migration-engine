# Prüfaufträge zum Schiedsrichterkosten-Rechner

Drei Aufträge zum Kopieren — einer prüft die Sätze gegen die Ordnung, einer das Werkzeug selbst,
einer sucht nach anderen Wegen für die Abrechnung. Sie sind selbsttragend formuliert: Wer sie
ausführt, braucht diese Unterhaltung nicht gelesen zu haben.

Bezugspunkte für alle drei:

- Quelltext: `tools/schiedsrichter-rechner/index.html` (eine HTML-Datei, Daten und Logik inline)
- Dokumentation: `docs/Schiedsrichterkosten-Rechner.md`
- Veröffentlichte Fassung: <https://claude.ai/code/artifact/4390e68c-f2cd-40fd-ac38-e62f9c4a4d37>

---

## Was zuerst geklärt werden muss

Von den elf Punkten des ersten Auftrags bewegen **zwei** einen Betrag; die übrigen bestätigen die
bisherige Praxis und haben keine Frist.

| Offene Frage | Was der Rechner annimmt | Wirkung bei Abweichung | Erstes betroffenes Spiel |
|---|---|---|---|
| Oberliga Herren, Stufe LSC | LSE und LSD je 35 €, ab LSC 45 € | jeder LSD-Schiedsrichter bekäme 10 € zu wenig | 19.09.2026, danach 16 weitere |
| Mitteldeutsche Liga | 19 € LSE / 25 € LSD+, BVSA-Sätze | Betrag und zuständige Ordnung unklar | 05.09.2026 |

Beides lässt sich ohne das PDF klären — zwei Fragen an den Sportwart genügen:

> 1. Oberliga Herren: Bekommt ein Schiedsrichter mit LSD-Lizenz 35 € oder 45 €? (Wir nehmen an:
>    35 €, und 45 € erst ab LSC.)
> 2. Mitteldeutsche Liga: Nach welcher Ordnung wird dort abgerechnet, und welche Gebühr gilt bei
>    mU12 bzw. mU17? (Wir rechnen mit 19 € LSE / 25 € LSD+.)

Ergibt die Antwort, dass die LSC-Annahme nicht stimmt, genügt es, `LSC_STUFE` im Quelltext zu
leeren — dann gilt wieder die übliche Grenze zwischen LSE und LSD.

Verfolgt wird das als [Issue #3](https://github.com/Zawa14-Rhinos/baserow-migration-engine/issues/3).

## 1 · Sätze gegen die Schiedsrichterordnung prüfen

> Am besten in einer Sitzung mit Zugriff auf bvsa.de oder mit der SRO als PDF im Anhang.

```text
Im Repository liegt unter tools/schiedsrichter-rechner/index.html ein Rechner für
Schiedsrichterkosten im Basketball (BVSA, Sachsen-Anhalt). Die hinterlegten Gebühren stehen
zusammengefasst in docs/Schiedsrichterkosten-Rechner.md unter "Gebührenlogik".

Prüfe jede dieser Annahmen gegen die BVSA-Schiedsrichterordnung 06/2026, Anlage 1 (bvsa.de,
Bereich Downloads bzw. Schiedsrichterwesen). Wenn du das Dokument nicht erreichst, sage das
deutlich und prüfe nichts "aus dem Gedächtnis".

1. Oberliga Herren: LSE und LSD je 35 EUR, ab LSC 45 EUR. In allen anderen Ligen liegt die
   Stufengrenze dagegen zwischen LSE und LSD. Stimmt beides?
2. Sätze Erwachsene je Liga und Geschlecht: Bezirksliga 20/25 Herren, 15/20 Damen;
   Landesliga 30/35 und 15/20; Oberliga 35/45 und 25/30; Oberliga-Play-offs Herren 40/50;
   Senioren 20/25; Pokal-HF/Finale mit Regionalliga-Beteiligung 65 Herren, 35 Damen.
   Gibt es einen Satz für Play-offs der Damen? Im Rechner fehlt er.
3. Jugend: Landes-/Oberliga-Ebene inkl. YSO 20/25, Bezirks-/Territorialebene 19/25,
   U11 und U12 unabhängig von der Ebene 19/25.
4. Bei nur einem angesetzten Schiedsrichter wird die Gebühr verdoppelt — außer bei U11/U12
   und YSO. Trifft die Ausnahme genau diese Klassen?
5. U10 und jünger: fällt dort tatsächlich keine Gebühr an, oder gilt das nur für bestimmte
   Spielrunden?
6. Mitteldeutsche Liga (Kooperationsliga über Landesgrenzen): Der Rechner nutzt 19/25 aus dem
   Spielplan. Nach welcher Ordnung wird dort abgerechnet — BVSA, ausrichtender Verband oder
   eigene Ligaregelung?
7. Fahrtkosten 0,30 EUR/km, Route Wohnort - Halle - Wohnort, kürzeste Strecke laut Maps;
   keine Fahrtkosten für ein Folgespiel in derselben Halle.
8. Tagegeld erst ab 8 Stunden Abwesenheit.
9. Kürzung um 50 %, wenn ein Schiedsrichter nicht 20 Minuten vor Anwurf in Schiedsrichter-
   kleidung in der Halle ist.
10. Auszahlung: bar vor Spielbeginn durch den Heimverein? Und wer zahlt bei einem Spiel auf
    neutralem Boden oder bei einem Turnier?
11. Regionalliga läuft über ein Abschlagsverfahren des Vereins — gilt das noch, und gibt es
    Vergleichbares auf Landesebene?

Antworte als Tabelle: Annahme | Ordnung sagt | Fundstelle (Paragraf/Anlage/Seite) | Bewertung.
Bewertung nur "bestätigt", "abweichend" oder "nicht belegbar" — nichts dazwischen, nichts geraten.
Für jede Abweichung: der konkrete Codeausschnitt, der zu ändern wäre, und der neue Wert.
Ändere nichts am Code, ohne dass ich es freigebe.
```

---

## 2 · Werkzeug fachlich und technisch prüfen

```text
Prüfe den Schiedsrichterkosten-Rechner in tools/schiedsrichter-rechner/index.html. Es ist eine
einzelne HTML-Datei mit Spielplan-Daten und Logik inline; Chromium steht über Playwright zur
Verfügung, öffne sie per file:// und bediene sie wirklich, statt nur den Code zu lesen.

Rechenwege, die stimmen müssen:
- Zwei Schiedsrichter mit unterschiedlichen Lizenzstufen im selben Spiel.
- Nur ein Schiedsrichter: Verdopplung ja bei U13-U20 und Erwachsenen, nein bei U11/U12.
- Fahrtkosten 0,30 EUR/km, null beim Folgespiel in derselben Halle.
- Tagesabrechnung mit mehreren Spielen: Summen, Reihenfolge, Entfernen eines Spiels aus der
  Mitte (die Unterschriften dürfen dabei nicht auf die falsche Quittung rutschen).
- Rundung: Trainer-Sicht auf volle 5 EUR aufgerundet, Schiedsrichter-Sicht centgenau, auf der
  Quittung immer der exakte Betrag.

Grenzfälle, die nicht abstürzen oder Unsinn zeigen dürfen: Spiel ohne Spielnummer, Spiel ohne
Halle, verlegtes Spiel, Spielrunde ohne Gebühr, Regionalliga-Abschlagsverfahren, Liga ohne
hinterlegten Satz, leere Eingaben, Kilometer als Dezimalzahl oder negativ, sehr lange Namen.

Außerdem:
- Druckausgabe (emulateMedia print und ein echtes PDF): erscheinen alle Quittungen des Tages,
  der Erstattungsblock nur mit IBAN, und keine Bedienelemente?
- Bedienbarkeit auf einem Telefon (375 px breit) und mit Tastatur allein.
- Datenschutz: Was landet in localStorage? Steht auf der Quittung mehr als die Postleitzahl?
  Verlässt irgendetwas das Gerät?
- Robustheit: Was passiert bei blockiertem localStorage (privates Fenster)?

Melde Befunde nach Schwere sortiert, jeder mit dem Weg zum Nachstellen und der betroffenen
Codestelle. Trenne echte Fehler von Geschmacksfragen. Bevor du etwas reparierst, zeig mir die
Liste.
```

---

## 3 · Andere Wege für Auszahlung und Erstattung suchen

```text
Beim USV Halle (Basketball, Ehrenamt) zahlen heute die Trainer die Schiedsrichter bar vor dem
Spiel aus eigener Tasche und reichen die unterschriebene Quittung später beim Verein ein. Ein
Rechner erzeugt Betrag und Quittung als PDF (tools/schiedsrichter-rechner/index.html,
Hintergrund in docs/Schiedsrichterkosten-Rechner.md).

Ziel: Nach dem Spiel abschicken, kurzfristig eine Bestätigung, Rückerstattung gesammelt einmal
im Monat. Offen ist, wie der Prozess am Ende aussieht.

Randbedingungen: alles ehrenamtlich, kein IT-Betrieb; ein Baserow-Workspace ist vorhanden; das
Werkzeug läuft heute ohne Server rein im Browser; personenbezogene Daten (Name, Anschrift, IBAN
der Schiedsrichter) sind im Spiel; am Spieltag zählt Geschwindigkeit, oft mit schlechtem Netz in
der Halle; die PDF brauchen je nach Liga Schiedsrichter, Trainer, Staffelleiter und Verein.

Entwickle fünf bis sechs grundverschiedene Wege, nicht Varianten desselben. Denk dabei über
Software hinaus: Vorschusskasse pro Mannschaft, Hallenkasse, Sammelabrechnung über den Verband
nach Art des Abschlagsverfahrens, Verzicht auf Bargeld zugunsten monatlicher Überweisung an die
Schiedsrichter, Abtretung an den Heimverein — und was dir sonst einfällt.

Je Weg: wie er konkret abläuft, was er für Trainer, Schiedsrichter und Kassenwart bedeutet, was
er technisch und organisatorisch kostet, woran er scheitern kann, und was rechtlich zu beachten
ist (Datenschutz, Belegpflicht, steuerliche Behandlung der Schiedsrichtereinnahmen).

Danach eine Empfehlung mit Begründung und ein erster Schritt, der sich in einer Woche umsetzen
lässt, ohne den heutigen Weg abzuschalten. Sag ausdrücklich, wo du unsicher bist.
```
