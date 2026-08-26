# Tests

Sie fahren den Rechner in einem echten Browser: Playwright öffnet `../index.html` über `file://`,
klickt sich durch und prüft, was dabei herauskommt. Kein Build, kein Server, keine Testbibliothek —
jede Datei ist ein eigenständiges Skript, das `OK` oder `FAIL` je Prüfung ausgibt.

```
node alle.mjs          # alle Suiten
node grundfunktionen.mjs   # einzeln
```

Playwright muss auffindbar sein — entweder lokal installiert (`npm i playwright`) oder über die
globale Installation:

```
NODE_PATH=$(npm root -g) node alle.mjs
```

| Datei | Deckt ab |
|---|---|
| `grundfunktionen.mjs` | Spielsuche, Berechnung, Tagesabrechnung mit Doppelansetzung, IBAN-Prüfziffer, Altersklassen und MDL, drei Lizenzstufen, Rollenwechsel |
| `abrechnungsvorgaenge.mjs` | Abschließen, Abrechnungsnummer, Sperre der Erfassung, Vorgangsliste, Doppelschutz, Datenminimierung, Verhalten ohne `localStorage` |
| `liga-pflichtangabe.mjs` | Liga bei manueller Erfassung — Hinweis am Feld, Einforderung beim Abschließen |
| `anschrift-und-verlegung.mjs` | vollständige Anschrift auf der Quittung, Anmahnung, verlegte Spiele, Unversehrtheit des Spielplans |
| `schiedsrichter-import.mjs` | Einfügen aus TeamSL: Formate, verworfene Kontaktdaten und Lizenznummern, Kopfzeilen, Vorschau, keine Doppeleinträge |
| `fortschritt-und-erstattung.mjs` | Fortschrittsleiste, Erstattungsblock unter Schritt 5, Druckbild |
| `pruefung-beim-abschliessen.mjs` | Lückenliste, Rückfrage beim Abschließen, Kilometer-Beschriftung, Verbandslinks |
| `freie-navigation.mjs` | alle Abschnitte von Anfang an erreichbar, Eingaben vor der Spielauswahl |
| `abrechnungsbogen.mjs` | Deckblatt: nur im Druck, nur in der Trainer-Sicht, vor den Quittungen, Summe gegen die Belege gerechnet, Nummern nach dem Abschließen |

**Beim Ändern beachten:** Ein Element, das außerhalb des sichtbaren Bereichs liegt, lässt sich nicht
mit der Maus bedienen — vor Zeichengesten `scrollIntoView({block: 'center'})`. Und die Sichtbarkeit
prüft man über `getClientRects()`, nicht über `getComputedStyle().display`: Ein Kind eines
ausgeblendeten Elternteils meldet weiterhin `block`.
