import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('dialog', d => d.accept());
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
await p.goto(SEITE);

const parse = z => p.evaluate(t => zeileParsen(t), z);

// 1 – von Hand getippt
let r = await parse('Mustermann, Max; LSD; Musterweg 3, 06110 Halle');
ok('einfaches Format', r.name === 'Mustermann, Max' && r.stufe === 'LSD' && r.adresse === 'Musterweg 3, 06110 Halle');
console.log('     ', JSON.stringify(r));

// 2 – aus einer Tabelle kopiert (Tabulatoren, Lizenz als Buchstabe)
r = await parse('Mustermann\tMax\tD\tMusterweg 3\t06110 Halle');
ok('Tabellen-Kopie mit Buchstabenlizenz', r.name === 'Mustermann, Max' && r.stufe === 'LSD' && r.adresse === 'Musterweg 3, 06110 Halle');
console.log('     ', JSON.stringify(r));

// 3 – Kontaktdaten werden verworfen
r = await parse('Beispiel, Erika\tLSE\tBeispielstr. 7, 06849 Dessau\terika@example.org\t0345 1234567');
ok('E-Mail verworfen', !JSON.stringify(r).includes('@'));
ok('Telefon verworfen', !JSON.stringify(r).includes('1234567'));
ok('Kontaktdaten gemeldet', r.kontakt === true);
console.log('     ', JSON.stringify(r));

// 4 – Lizenznummer landet nicht in den Daten
r = await parse('Voigt, Andreas\t123456\tLSD\tBeispielweg 12, 06110 Halle');
ok('Lizenznummer verworfen', !JSON.stringify(r).includes('123456'));

// 5 – Spalten mit mehreren Leerzeichen
r = await parse('Schulze, Anna     LSC     Ringstraße 9, 06108 Halle');
ok('Leerzeichen-Spalten', r.name === 'Schulze, Anna' && r.stufe === 'LSC');

// 6 – unbrauchbare Zeile
r = await parse('12345');
ok('unklare Zeile markiert', r.fehler === true);

// --- Vorschau und Übernahme
await p.click('#listeBox summary');
await p.fill('#listeText', [
  'Mustermann\tMax\tD\tMusterweg 3\t06110 Halle',
  'Beispiel, Erika\tLSE\tBeispielstr. 7, 06849 Dessau\terika@example.org',
  '???',
  'Nachname\tVorname\tLizenz\tStraße\tOrt'
].join('\n'));
await p.waitForTimeout(200);
const v = await p.textContent('#listeVorschau');
ok('Vorschau zählt richtig', v.includes('2 von 3'));
ok('Tabellenkopf übersprungen', v.includes('Überschrift übersprungen'));
ok('Vorschau meldet verworfene Kontaktdaten', v.includes('verworfen'));
ok('Vorschau markiert unklare Zeile', v.includes('nicht erkannt'));
await p.click('#listeSpeichern'); await p.waitForTimeout(200);
ok('zwei Einträge übernommen', (await p.textContent('#listeAnzahl')) === '2');
const gespeichert = await p.evaluate(() => ({
  liste: JSON.parse(localStorage.getItem('usv-sr-liste')),
  adr: JSON.parse(localStorage.getItem('usv-sr-adr'))
}));
ok('keine Kontaktdaten gespeichert', !JSON.stringify(gespeichert).includes('@'));
ok('Anschrift gleich mitgemerkt', JSON.stringify(gespeichert.adr).includes('Musterweg 3'));

// --- Autovervollständigung im Formular
await p.fill('#q', '9606'); await p.click('#results li');
await p.fill('#nam1', 'Mustermann, Max'); await p.locator('#nam1').blur(); await p.waitForTimeout(250);
ok('Lizenzstufe übernommen', (await p.locator('#lic1').inputValue()) === 'lsd');
ok('Anschrift übernommen', (await p.textContent('#plz1')).includes('Musterweg 3'));

// --- erneutes Einfügen verdoppelt nicht
await p.click('#weiter').catch(() => {});
await p.fill('#listeText', 'Mustermann\tMax\tC\tNeuer Weg 5\t06110 Halle');
await p.waitForTimeout(150);
await p.click('#listeSpeichern'); await p.waitForTimeout(200);
ok('kein Doppeleintrag', (await p.textContent('#listeAnzahl')) === '2');
const nachher = await p.evaluate(() => JSON.parse(localStorage.getItem('usv-sr-liste')).find(x => /Mustermann/.test(x.name)));
ok('Eintrag aktualisiert', nachher.stufe === 'LSC' && nachher.adresse.includes('Neuer Weg 5'));

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
