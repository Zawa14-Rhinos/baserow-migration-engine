import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('dialog', d => d.accept());
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
const stand = z => p.getAttribute(`#fortschritt button[data-ziel="${z}"]`, 'data-stand');
await p.goto(SEITE);

ok('Start: Schritt 1 ist aktuell', await stand('s1') === 'aktuell');
ok('Start: Rest offen', await stand('s3') === 'offen' && await stand('s5') === 'offen');

await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(200);
ok('Spiel gewählt → Schritt 1 fertig', await stand('s1') === 'fertig');
ok('Schiedsrichter jetzt aktuell', await stand('s3') === 'aktuell');

await p.click('#count button[data-n="1"]'); await p.waitForTimeout(150);
await p.fill('#nam1', 'Andreas Voigt'); await p.fill('#km1', '12');
await p.fill('#adr1', 'Beispielweg 12, 06110 Halle');
await p.locator('#adr1').dispatchEvent('change'); await p.locator('#nam1').blur();
await p.waitForTimeout(250);
ok('Name eingetragen → Schritt 2 fertig', await stand('s3') === 'fertig');
ok('Quittung jetzt aktuell', await stand('s4') === 'aktuell');

// unterschreiben
const cv = p.locator('#quittungen canvas').first();
await cv.evaluate(el => el.scrollIntoView({block: 'center'})); await p.waitForTimeout(200);
const box = await cv.boundingBox();
await p.mouse.move(box.x + 30, box.y + 40); await p.mouse.down();
await p.mouse.move(box.x + 120, box.y + 70, { steps: 5 }); await p.mouse.up();
await p.waitForTimeout(250);
ok('unterschrieben → Schritt 3 fertig', await stand('s4') === 'fertig');
ok('Summenbalken tritt beim Zeichnen zurück und kommt wieder',
   !(await p.locator('#total').evaluate(el => el.classList.contains('beiseite'))));
ok('Abschluss jetzt aktuell', await stand('s5') === 'aktuell');

// Erstattung liegt jetzt in Schritt 5
const inS5 = await p.evaluate(() => document.getElementById('s5').contains(document.getElementById('erstattung')));
ok('Erstattungsblock steht unter Abschließen', inS5);
const inS5druck = await p.evaluate(() => document.getElementById('s5').contains(document.getElementById('erstattungDruck')));
ok('Erstattungsbeleg ebenfalls', inS5druck);

await p.fill('#ibanName', 'Marcus Zawatzki');
await p.fill('#iban', 'DE89370400440532013000'); await p.waitForTimeout(200);
await p.click('#abschliessen'); await p.waitForTimeout(300);
ok('abgeschlossen → alle vier fertig',
   ['s1','s3','s4','s5'].every(async z => await stand(z) === 'fertig') && await stand('s5') === 'fertig');

// Druckbild: Erstattungsbeleg muss trotz Schritt 5 erscheinen
await p.emulateMedia({ media: 'print' });
const sicht = await p.evaluate(() => {
  const an = el => !!(el && el.getClientRects().length);
  return { beleg: an(document.getElementById('erstattungDruck')),
           eingaben: an(document.getElementById('erstattung')),
           zahlart: an(document.getElementById('zahlart')),
           kopf5: an(document.querySelector('#s5 > .head')),
           quittung: an(document.querySelector('.beleg')),
           leiste: an(document.getElementById('fortschritt')) };
});
console.log('     Druck:', JSON.stringify(sicht));
ok('Druck: Erstattungsbeleg sichtbar', sicht.beleg);
ok('Druck: Eingabefelder und Leiste weg', !sicht.eingaben && !sicht.zahlart && !sicht.kopf5 && !sicht.leiste);
await p.emulateMedia({ media: 'screen' });

// Sprungmarke
await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(200);
await p.click('#fortschritt button[data-ziel="s1"]'); await p.waitForTimeout(700);
const imBlick = await p.evaluate(() => {
  const r = document.getElementById('s1').getBoundingClientRect();
  return r.top > -50 && r.top < window.innerHeight;
});
ok('Klick springt zum Schritt', imBlick);

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
