import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
const fehler = [], dialoge = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('dialog', d => { dialoge.push(d.message()); d.dismiss(); });
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
await p.goto(SEITE);

// --- Liga hält die Erfassung nicht mehr auf
await p.click('details.frei summary');
await p.selectOption('#ebene', 'j-bez'); await p.selectOption('#alter', '12');
await p.click('#freiOk'); await p.waitForTimeout(250);
ok('ohne Liga wird das Spiel trotzdem übernommen', !(await p.locator('#s2').isHidden()));
ok('Hinweis am Feld bleibt sichtbar', !(await p.locator('#fligaHint').isHidden()));

// --- Lückenliste wächst mit
await p.click('#count button[data-n="1"]'); await p.waitForTimeout(200);
let l = await p.textContent('#luecken');
ok('Liga steht in der Lückenliste', l.includes('Liga laut Spielplan'));
ok('Name fehlt gemeldet', l.includes('Name des Schiedsrichters'));
ok('Unterschrift fehlt gemeldet', l.includes('Unterschrift'));

await p.fill('#nam1', 'Andreas Voigt'); await p.locator('#nam1').blur(); await p.waitForTimeout(250);
l = await p.textContent('#luecken');
ok('Name erledigt, Anschrift folgt', !l.includes('Name des Schiedsrichters') && l.includes('Anschrift von Andreas Voigt'));

await p.fill('#adr1', 'Beispielweg 12, 06110 Halle');
await p.locator('#adr1').dispatchEvent('change'); await p.waitForTimeout(250);
l = await p.textContent('#luecken');
ok('Anschrift erledigt', !l.includes('Anschrift von'));

// --- Abschließen mit Lücken fragt nach und bricht bei Nein ab
await p.click('#abschliessen'); await p.waitForTimeout(300);
ok('Rückfrage listet alle Lücken', dialoge.length === 1 && dialoge[0].includes('Liga') && dialoge[0].includes('Unterschrift'));
ok('bei Abbruch nicht abgeschlossen', await p.locator('#abschlussOk').isHidden());
console.log('     Dialog:', JSON.stringify(dialoge[0]));

// --- Lücken schließen
await p.fill('#fliga', 'Bezirksliga Halle männlich U12');
await p.click('#freiOk'); await p.waitForTimeout(300);
await p.fill('#nam1', 'Andreas Voigt'); await p.locator('#nam1').blur(); await p.waitForTimeout(250);
const cv = p.locator('#quittungen canvas').first();
await cv.evaluate(el => el.scrollIntoView({block: 'center'})); await p.waitForTimeout(200);
const box = await cv.boundingBox();
await p.mouse.move(box.x + 40, box.y + 45); await p.mouse.down();
await p.mouse.move(box.x + 200, box.y + 55, { steps: 6 }); await p.mouse.up();
await p.waitForTimeout(300);
l = await p.locator('#luecken').isHidden() ? '' : await p.textContent('#luecken');
console.log('     Rest-Lücken:', JSON.stringify(l));
ok('nur noch die IBAN offen', l.includes('IBAN') && !l.includes('Liga') && !l.includes('Unterschrift'));
await p.fill('#iban', 'DE89370400440532013000'); await p.waitForTimeout(250);
ok('Lückenliste verschwindet', await p.locator('#luecken').isHidden());

const vorher = dialoge.length;
await p.click('#abschliessen'); await p.waitForTimeout(350);
ok('ohne Lücken keine Rückfrage', dialoge.length === vorher);
ok('abgeschlossen', !(await p.locator('#abschlussOk').isHidden()));

// --- Kilometer-Beschriftung
await p.evaluate(() => window.scrollTo(0, 0));
ok('Feld sagt hin und zurück', (await p.textContent('#s3')).includes('Kilometer hin und zurück'));
ok('Erläuterung unter dem Feld', (await p.textContent('#s3')).includes('Wohnort → Halle → Wohnort'));
ok('Maps-Link benennt Hin- und Rückweg', (await p.textContent('#s3')).includes('Hin- und Rückweg'));
ok('Link zum Verband vorhanden', (await p.locator('a[href="https://www.basketball-bund.net/"]').count()) >= 2);

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
