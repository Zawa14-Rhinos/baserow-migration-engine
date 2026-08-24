# Schiedsrichterkosten-Rechner — Quelltext

Orientierung für alle, die am Werkzeug weiterarbeiten. Was es fachlich tut, steht in
[`docs/Schiedsrichterkosten-Rechner.md`](../../docs/Schiedsrichterkosten-Rechner.md); wie man es
bedient, in der [Kurzanleitung](../../docs/Kurzanleitung%20Schiedsrichterkosten-Rechner.md).

```
tools/schiedsrichter-rechner/
  index.html        aktueller Stand — Programm, Spielplan und Sätze in einer Datei
  archiv/           frühere Fassungen, jede für sich lauffähig
  tests/            Browser-Tests (Playwright), `node alle.mjs`
  README.md         diese Datei
```

## Warum eine einzige Datei

Der Rechner läuft am Spieltag in Hallen ohne verlässliches Netz, auf Privatgeräten, ohne
Installation und ohne Betrieb durch jemanden. Deshalb steckt alles in einer HTML-Datei: kein
Build-Schritt, keine Abhängigkeiten, kein Nachladen. Herunterladen und öffnen genügt — auch im
Flugmodus. Das ist die wichtigste Randbedingung; Vorschläge, die sie aufgeben, müssen einen
sehr guten Grund haben.

## Aufbau der Datei

| Abschnitt | Inhalt |
|---|---|
| `<style>` | Farbtoken für hell und dunkel, Komponenten, Druckregeln (`@media print`) |
| Markup | Kopf mit Rollenumschalter, Fortschrittsleiste, fünf `section.step`, Aufklappbereiche, fixierter Summenbalken |
| `const DATEN` | Spielplan als JSON: `stand`, `korrigiert`, `einreichenMail`, `spiele[]` |
| Skript | Sätze, Speicher, Formularaufbau, Berechnung, Quittungen, Vorgänge, Prüfung |

## Zentrale Funktionen

| Funktion | Aufgabe |
|---|---|
| `saetzeVon(spiel)` | Gebührensätze je Lizenzstufe; wandelt die zweistufige Angabe im Datensatz in `{lse, lsd, lsc}` und berücksichtigt `LSC_STUFE` |
| `tarifFrei()` | Sätze für frei erfasste Spiele aus Spielebene, Altersklasse und Mannschaft |
| `waehle(spiel)` | übernimmt ein Spiel — arbeitet mit einer **Kopie**, damit Verlegungen den Spielplan nicht verändern |
| `baueRefs()` | baut die Eingabeblöcke je Schiedsrichter; **sichert vorhandene Werte** und setzt sie danach wieder ein |
| `rechne()` | einziger Rechenweg: Posten je Schiedsrichter, Summen, Anstoß für alles Weitere |
| `gruppen()` | alle Quittungen des Tages: abgeschlossene Spiele plus das gerade bearbeitete |
| `quittungen()` | rendert die Belege — **nicht** während des Unterschreibens und nur bei echter Inhaltsänderung |
| `luecken()` / `lueckenAnzeigen()` | Vollständigkeitsprüfung, die erst beim Abschließen greift |
| `abschliessen()` | vergibt die Abrechnungsnummer, friert die Beträge ein, legt den Vorgang ab |
| `fortschritt()` | leitet den Stand der vier Punkte aus dem tatsächlichen Inhalt ab |

## Regeln, die leicht kaputtgehen

- **Beträge laufen in Cent als Ganzzahl** (`gebuehr_ct`, `fahrt_ct`, `summe_ct`). Eurowerte entstehen
  erst bei der Ausgabe über `eurCt()`. Wer eine neue Rechenstelle einbaut, bleibt in Cent.
- **Der auf 5 € aufgerundete Betrag** ist reine Anzeige für das Portemonnaie und darf nirgends
  gespeichert oder übertragen werden.
- **Quittungen nicht bei jedem Tastendruck neu rendern.** Während einer Unterschrift gar nicht —
  sonst wird das Feld mitten in der Geste ersetzt und der Strich ist weg. Das regeln
  `zeichnetAktiv`, `renderAusstehend` und `letzterRenderSchluessel`.
- **`waehle()` kopiert das Spiel.** Direkt auf dem Datensatz zu arbeiten würde eine Verlegung
  dauerhaft in den Spielplan schreiben.
- **`[hidden]` braucht `display: none !important`**, weil Komponenten mit eigener `display`-Regel es
  sonst überstimmen.
- **Nichts blockiert die Erfassung.** Pflichtangaben werden über `luecken()` beim Abschließen
  eingefordert, nicht über Sperren unterwegs.

## Was lokal gespeichert wird

| Schlüssel | Inhalt |
|---|---|
| `usv-sr-liste` | Schiedsrichter: Name, Lizenzstufe, Anschrift |
| `usv-sr-adr` | Name → Anschrift |
| `usv-sr-km` | Name + Halle → Kilometer |
| `usv-sr-profil` | eigene Daten in der Schiedsrichter-Sicht |
| `usv-sr-konto` | IBAN und Kontoinhaber, nur wenn angehakt |
| `usv-sr-vorgaenge` | abgeschlossene Abrechnungen, Schema-Version 1 |

Jeder Zugriff liegt in `try`/`catch`: In einem privaten Fenster wirft der Speicher, und der Rechner
muss trotzdem laufen.

## Ändern und prüfen

Es gibt keinen Build. Datei bearbeiten, im Browser öffnen, fertig. Vor jeder Veröffentlichung
gehören durchgespielt:

- beide Rollen, Berechnung mit unterschiedlichen Lizenzstufen und die Verdopplung bei nur einem
  Schiedsrichter (U11/U12 ausgenommen),
- Tagesabrechnung mit zwei Spielen, inklusive Entfernen des mittleren,
- Unterschreiben, Abschließen, Druckausgabe als PDF,
- Verhalten ohne `localStorage`,
- Ansicht auf 375 px Breite.

Automatisiert geht das mit den Suiten in [`tests/`](tests/README.md): Playwright öffnet die Datei
über `file://`, klickt sich durch und prüft das Ergebnis.

```
cd tools/schiedsrichter-rechner/tests
NODE_PATH=$(npm root -g) node alle.mjs
```

Derzeit acht Suiten mit 131 Prüfungen. Wer eine Funktion ergänzt, ergänzt dort die Fälle — mehrere
der heute gefundenen Fehler sind erst durch diese Tests aufgefallen.

## Spielplan aktualisieren

`DATEN.spiele` im Skriptkopf ersetzen und `stand` mitziehen. Einzelne Korrekturen zwischendurch
werden über `korrigiert` ausgewiesen, verlegte Spiele über `verlegtVon`. Perspektivisch soll der
Datensatz aus der Baserow-Tabelle `Spiele` erzeugt werden statt von Hand gepflegt zu werden.

## Veröffentlichen

Die Datei wird als Artifact unter einer festen Adresse veröffentlicht; frühere Fassungen bleiben
über den Versionsverlauf erreichbar. Die Versionsnummer steht als `VERSION` im Skript und in der
Fußzeile — sie gehört bei jeder spürbaren Änderung erhöht, damit bei Rückfragen klar ist, welche
Fassung jemand vor sich hat.
