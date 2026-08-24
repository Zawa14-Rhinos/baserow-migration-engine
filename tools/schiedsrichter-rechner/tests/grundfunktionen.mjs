import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const fehler = [];
p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
p.on('pageerror', e => fehler.push('PAGEERROR ' + e.message));
await p.goto(SEITE);

const ok = (n, b) => console.log((b ? 'OK   ' : 'FAIL ') + n);

// 1 – Spiel aus dem Spielplan
await p.fill('#q', '9606');
await p.click('#results li');
ok('Spiel gewählt, Schritt 3 sichtbar', !(await p.locator('#s3').isHidden()));
await p.fill('#nam1', 'Max Muster');
await p.fill('#km1', '20');
await p.locator('#nam1').blur();
await p.waitForTimeout(150);
console.log('     Summe:', await p.textContent('#sum'), '|', (await p.textContent('#split')).replace(/\s+/g,' '));
ok('Quittungen sichtbar', (await p.locator('.beleg').count()) >= 2);

// 2 – Doppelansetzung
await p.click('#weiter');
ok('Tagesliste sichtbar', !(await p.locator('#tagesliste').isHidden()));
await p.fill('#q', 'Team Leipzig');
await p.click('#results li');
await p.waitForTimeout(150);
ok('Name übernommen', (await p.inputValue('#nam1')) === 'Max Muster');
ok('Folgespiel: Fahrtkosten aus', await p.isChecked('#folge1'));
console.log('     Summe 2 Spiele:', await p.textContent('#sum'), '|', (await p.textContent('#split')).replace(/\s+/g,' '));
ok('4 Quittungen im Dokument', (await p.locator('.beleg').count()) === 4 + 1); // +1 = Erstattungsblock
await p.click('[data-weg="0"]');
await p.waitForTimeout(100);
ok('Entfernen reindiziert ohne Fehler', (await p.locator('#tagesliste').isHidden()));

// 3 – IBAN
await p.fill('#iban', 'DE89370400440532013000');
await p.waitForTimeout(100);
ok('IBAN gruppiert', (await p.inputValue('#iban')) === 'DE89 3704 0044 0532 0130 00');
ok('Prüfziffer erkannt', (await p.textContent('#ibanHint')).startsWith('Prüfziffer stimmt.'));
await p.fill('#iban', 'DE89370400440532013001');
await p.waitForTimeout(100);
ok('Falsche Prüfziffer gemeldet', (await p.textContent('#ibanHint')).includes('nicht'));

// 4 – Freitext: MDL mit Altersklasse
await p.reload();
await p.click('details.frei summary');
await p.selectOption('#ebene', 'j-mdl');
await p.selectOption('#alter', '17');
await p.selectOption('#geschlecht', 'm');
await p.waitForTimeout(80);
const i17 = await p.textContent('#satzInfo');
console.log('     MDL mU17:', i17.replace(/\s+/g,' '));
ok('mU17 verdoppelt bei einem SR', i17.includes('doppelte Gebühr'));
await p.selectOption('#alter', '12');
await p.waitForTimeout(80);
const i12 = await p.textContent('#satzInfo');
console.log('     MDL mU12:', i12.replace(/\s+/g,' '));
ok('mU12 nicht verdoppelt', i12.includes('keine') && i12.includes('mU12'));
await p.selectOption('#geschlecht', 'w');
await p.waitForTimeout(80);
ok('weibliche Klasse getrennt', (await p.textContent('#satzInfo')).includes('wU12'));

// 5 – Oberliga Herren: drei Lizenzstufen
await p.selectOption('#ebene', 'e-ober');
await p.selectOption('#geschlecht', 'm');
await p.waitForTimeout(80);
console.log('     Oberliga H:', (await p.textContent('#satzInfo')).replace(/\s+/g,' '));
await p.fill('#fliga', 'Oberliga Herren');   // Pflichtfeld seit v1.1
await p.click('#freiOk');
await p.waitForTimeout(120);
const opts = await p.locator('#lic1 option').allTextContents();
ok('drei Lizenzstufen', opts.length === 3);
console.log('     Stufen:', opts.join(' | '));

// 6 – Schiedsrichter-Sicht
await p.click('#rolle button[data-r="sr"]');
await p.waitForTimeout(120);
ok('nur ein Eingabeblock', (await p.locator('#refs .ref').count()) === 1);
ok('Profilbox sichtbar', !(await p.locator('#profilBox').isHidden()));
ok('Überschrift wechselt', (await p.textContent('#h1')).includes('bekomme'));
ok('Summenlabel wechselt', (await p.textContent('#lbl')) === 'Das bekommst du');

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
