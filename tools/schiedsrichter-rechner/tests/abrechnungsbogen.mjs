/* Der Abrechnungsbogen ist das Deckblatt fuer die Geschaeftsstelle. Geprueft
   wird: er erscheint nur im Druck, nur in der Rolle "Ich zahle aus", steht vor
   den Quittungen, und die Summe stimmt mit den Belegen ueberein. */
import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('dialog', d => d.accept());
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
const an = s => p.evaluate(x => {
  const e = document.querySelector(x); return !!(e && e.getClientRects().length);
}, s);

await p.goto(SEITE);
ok('am Bildschirm unsichtbar, solange nichts erfasst ist', !(await an('#bogen')));

await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(200);
await p.fill('#nam1', 'Anna Beispiel'); await p.fill('#km1', '24');
await p.fill('#adr1', 'Musterweg 1, 06110 Halle'); await p.locator('#adr1').dispatchEvent('change');
await p.fill('#nam2', 'Bert Muster'); await p.fill('#km2', '12');
await p.fill('#adr2', 'Testgasse 5, 06120 Halle'); await p.locator('#adr2').dispatchEvent('change');
await p.waitForTimeout(250);
ok('auch mit Spiel am Bildschirm unsichtbar', !(await an('#bogen')));

await p.emulateMedia({ media: 'print' });
ok('im Druck sichtbar', await an('#bogen'));
ok('steht vor der ersten Quittung', await p.evaluate(() => {
  const bo = document.getElementById('bogen'), q = document.querySelector('.beleg');
  return !!(bo && q) && (bo.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
}));
ok('beginnt eine eigene Seite', await p.evaluate(() =>
  getComputedStyle(document.getElementById('bogen')).breakAfter === 'page' ||
  getComputedStyle(document.getElementById('bogen')).pageBreakAfter === 'always'));

const zeilen = await p.locator('#bogen tbody tr').count();
ok('eine Zeile je Spiel plus Summenzeile', zeilen === 2);
let text = await p.locator('#bogen').innerText();
ok('Verein steht im Kopf', /USV Halle/.test(text));
ok('Mannschaft steht im Kopf', /mU16 III/.test(text));
ok('Grundlage steht im Kopf', /BVSA-SRO/.test(text));
ok('beide Schiedsrichter stehen in der Zeile', /Anna Beispiel/.test(text) && /Bert Muster/.test(text));
const cent = t => Math.round(parseFloat(String(t).replace(/[^\d,]/g, '').replace(',', '.')) * 100);
const summen = async () => p.evaluate(() => ({
  bogen: [...document.querySelectorAll('#bogen tr.summe td')].pop().textContent,
  belege: [...document.querySelectorAll('.beleg .gesamt .num')].map(e => e.textContent)
}));
let sm = await summen();
ok('Summe des Bogens ist die Summe der Quittungen',
   cent(sm.bogen) === sm.belege.reduce((a, t) => a + cent(t), 0));
ok('Betrag stimmt rechnerisch: 2 × 25 € + 36 km × 0,30 €', cent(sm.bogen) === 6080);
ok('Anlagenhinweis nennt die Zahl der Quittungen', /Anlage: 2 unterschriebene Quittungen/.test(text));
ok('Unterschriftsfeld ist da', /Ort, Datum/.test(text));
ok('Feld für die Geschäftsstelle ist da', /GESCHÄFTSSTELLE|Geschäftsstelle/.test(text));
ok('Abrechnungsnummer noch offen, solange nicht abgeschlossen', /noch offen/.test(text));

// zweites Spiel am selben Tag
await p.emulateMedia({ media: 'screen' });
await p.click('#weiter'); await p.waitForTimeout(200);
await p.fill('#q', 'Team Leipzig'); await p.click('#results li'); await p.waitForTimeout(250);
await p.fill('#nam1', 'Anna Beispiel'); await p.fill('#nam2', 'Bert Muster'); await p.waitForTimeout(250);
await p.emulateMedia({ media: 'print' });
ok('zweites Spiel ergibt eine zweite Zeile', await p.locator('#bogen tbody tr').count() === 3);
text = await p.locator('#bogen').innerText();
ok('Summenzeile zählt beide Spiele', /Summe · 2 Spiele/.test(text));
ok('Anlagen jetzt vier Quittungen', /Anlage: 4 unterschriebene Quittungen/.test(text));
sm = await summen();
ok('Summe über beide Spiele ist die Summe aller Quittungen',
   cent(sm.bogen) === sm.belege.reduce((a, t) => a + cent(t), 0));

// Kontoverbindung
await p.emulateMedia({ media: 'screen' });
await p.selectOption('#zahlart', 'bar_ausgelegt');
await p.fill('#ibanName', 'Marcus Zawatzki');
await p.fill('#iban', 'DE89370400440532013000'); await p.waitForTimeout(250);
await p.emulateMedia({ media: 'print' });
text = await p.locator('#bogen').innerText();
ok('Kontoinhaber steht auf dem Bogen', /Marcus Zawatzki/.test(text));
ok('IBAN in Vierergruppen', /DE89 3704 0044 0532 0130 00/.test(text));
ok('Zahlungsart steht auf dem Bogen', /von mir ausgelegt/.test(text));

// abschliessen vergibt die Nummern
await p.emulateMedia({ media: 'screen' });
await p.click('#abschliessen'); await p.waitForTimeout(400);
await p.emulateMedia({ media: 'print' });
text = await p.locator('#bogen').innerText();
ok('Abrechnungsnummern stehen jetzt in der Tabelle', /SR-\d{8}-/.test(text) && !/noch offen/.test(text));

// Rolle "Ich pfeife": kein Bogen
await p.emulateMedia({ media: 'screen' });
await p.click('#neueAbrechnung'); await p.waitForTimeout(200);
await p.click('#rolle button[data-r="sr"]'); await p.waitForTimeout(200);
await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(200);
await p.fill('#nam1', 'Anna Beispiel'); await p.fill('#km1', '24'); await p.waitForTimeout(250);
await p.emulateMedia({ media: 'print' });
ok('in der Schiedsrichter-Sicht kein Bogen', !(await an('#bogen')));
ok('die Quittung bleibt auch dort im Druck', await an('.beleg'));

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
