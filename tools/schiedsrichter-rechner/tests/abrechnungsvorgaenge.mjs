import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const fehler = [];
p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
p.on('pageerror', e => fehler.push('PAGEERROR ' + e.message));
p.on('dialog', d => d.accept());
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
const U = SEITE;
await p.goto(U);

// --- Summen unverändert (Regression gegen die Cent-Umstellung)
await p.fill('#q', '9606'); await p.click('#results li');
await p.fill('#nam1', 'Max Muster'); await p.fill('#km1', '20'); await p.locator('#nam1').blur();
await p.fill('#nam2', 'Erika Beispiel'); await p.fill('#km2', '12'); await p.locator('#nam2').blur();
await p.waitForTimeout(200);
const split = (await p.textContent('#split')).replace(/\s+/g, ' ');
ok('Summe wie vor der Umstellung (59,60 €)', split.includes('59,60'));
ok('Bargeld auf 5 € gerundet (60,00 €)', (await p.textContent('#sum')).includes('60,00'));
console.log('     ', split, '|', await p.textContent('#sum'));
// Krummer Kilometerwert
await p.fill('#km1', '12.5'); await p.waitForTimeout(150);
console.log('      12,5 km:', (await p.textContent('#split')).replace(/\s+/g, ' '));
ok('Dezimalkilometer sauber gerundet (3,75 €)', (await p.textContent('#quittungen')).includes('3,75'));
await p.fill('#km1', '20'); await p.waitForTimeout(150);

// --- Schritt 5 vorhanden, Quittung trägt Grundlage
ok('Schritt 5 sichtbar', !(await p.locator('#s5').isHidden()));
ok('Grundlage steht auf der Quittung', (await p.textContent('#quittungen')).includes('BVSA-SRO 06/2026'));
ok('Zahlungsart trainer-spezifisch', (await p.locator('#zahlart option').allTextContents()).length === 3);

// --- Abschließen
await p.selectOption('#zahlart', 'bar_ausgelegt');
await p.click('#abschliessen');
await p.waitForTimeout(250);
const bestaetigung = await p.textContent('#abschlussOk');
const idTreffer = bestaetigung.match(/SR-\d{8}-\w+-\w{4}/);
ok('Abrechnungsnummer vergeben', !!idTreffer);
console.log('     ', idTreffer && idTreffer[0]);
ok('Nummer steht auf der Quittung', (await p.textContent('#quittungen')).includes(idTreffer[0]));
ok('Erfassung gesperrt', await p.locator('#nam1').isDisabled() && await p.locator('#q').isDisabled());
ok('Unterschrift bleibt möglich', await p.locator('#quittungen canvas').first().isEnabled());
ok('Drucken bleibt möglich', await p.locator('#print').isEnabled());
ok('Liste zeigt den Vorgang', (await p.textContent('#vorgangAnzahl')) === '1');

// --- Doppelschutz (Dialog wird akzeptiert -> zweiter Vorgang entsteht bewusst)
const vorher = await p.evaluate(() => JSON.parse(localStorage.getItem('usv-sr-vorgaenge')).liste.length);
await p.click('#neueAbrechnung'); await p.waitForTimeout(200);
await p.fill('#q', '9606'); await p.click('#results li');
await p.fill('#nam1', 'Max Muster'); await p.locator('#nam1').blur(); await p.waitForTimeout(150);
await p.click('#abschliessen'); await p.waitForTimeout(250);
const nachher = await p.evaluate(() => JSON.parse(localStorage.getItem('usv-sr-vorgaenge')).liste.length);
ok('Doppelschutz meldet sich, Bestätigung legt trotzdem an', nachher === vorher + 1);

// --- gespeicherte Felder: Datenminimierung
const v = await p.evaluate(() => JSON.parse(localStorage.getItem('usv-sr-vorgaenge')).liste[0]);
console.log('      Vorgang:', JSON.stringify(v).slice(0, 240));
ok('keine PLZ gespeichert', !JSON.stringify(v).includes('plz'));
ok('keine Unterschrift gespeichert', !JSON.stringify(v).includes('data:image'));
ok('Beträge in Cent', Number.isInteger(v.summe_ct) && v.summe_ct > 0);

// --- als eingereicht markieren
await p.click('#vorgangBox summary');
await p.click('[data-ein="0"]'); await p.waitForTimeout(150);
ok('Status wechselt auf eingereicht', (await p.textContent('#vorgangListe')).includes('eingereicht'));

// --- Neustart: Liste überlebt den Reload
await p.reload(); await p.waitForTimeout(400);
ok('Liste nach Reload da', (await p.textContent('#vorgangAnzahl')) === String(nachher));

// --- SR-Rolle: eigene Zahlungsarten
await p.click('#rolle button[data-r="sr"]'); await p.waitForTimeout(150);
ok('Zahlungsart sr-spezifisch', (await p.locator('#zahlart option').allTextContents()).length === 2);

// --- blockierter localStorage
const p2 = await b.newPage();
const f2 = [];
p2.on('pageerror', e => f2.push(e.message));
p2.on('dialog', d => d.accept());
await p2.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('blockiert'); } });
});
await p2.goto(U);
await p2.waitForTimeout(400);
await p2.fill('#q', '9606'); await p2.click('#results li');
await p2.fill('#nam1', 'Test');
await p2.fill('#adr1', 'Teststraße 1, 06110 Halle');
await p2.locator('#adr1').dispatchEvent('change');
await p2.locator('#nam1').blur(); await p2.waitForTimeout(200);
await p2.click('#abschliessen'); await p2.waitForTimeout(250);
ok('läuft ohne localStorage weiter', f2.length === 0 && !(await p2.locator('#abschlussOk').isHidden()));
if (f2.length) console.log('      Fehler ohne Speicher:', f2.join(' / '));

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
