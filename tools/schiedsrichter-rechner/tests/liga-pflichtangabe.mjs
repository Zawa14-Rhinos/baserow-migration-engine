import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
await p.goto(SEITE);

await p.click('details.frei summary');
await p.selectOption('#ebene', 'j-bez');
await p.selectOption('#alter', '18');
await p.selectOption('#geschlecht', 'm');
// ohne Liga
await p.click('#freiOk');
await p.waitForTimeout(150);
ok('ohne Liga: Spiel wird trotzdem übernommen', !(await p.locator('#s2').isHidden()));
ok('ohne Liga: Hinweis sichtbar', !(await p.locator('#fligaHint').isHidden()));
ok('ohne Liga: Feld markiert', await p.locator('#fliga').evaluate(e => e.classList.contains('fehlt')));
ok('ohne Liga: beim Abschließen eingefordert', (await p.textContent('#luecken')).includes('Liga laut Spielplan'));
// Tippen löscht den Hinweis
await p.fill('#fliga', 'Bezirksliga Halle/Harz männlich U18');
await p.waitForTimeout(100);
ok('Hinweis verschwindet beim Tippen', await p.locator('#fligaHint').isHidden());
await p.click('#freiOk');
await p.waitForTimeout(200);
ok('mit Liga: Spiel übernommen', !(await p.locator('#s2').isHidden()));
ok('Liga steht im Spielkopf', (await p.textContent('#tags')).includes('Bezirksliga Halle/Harz männlich U18'));
await p.fill('#nam1', 'Test'); await p.locator('#nam1').blur(); await p.waitForTimeout(200);
ok('Liga steht auf der Quittung', (await p.textContent('#quittungen')).includes('Bezirksliga Halle/Harz männlich U18'));
console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
