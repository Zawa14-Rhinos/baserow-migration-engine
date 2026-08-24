import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
const dialoge = [];
p.on('dialog', d => { dialoge.push(d.message()); d.accept(); });
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
await p.goto(SEITE);

// --- volle Anschrift auf der Quittung
await p.fill('#q', '9606'); await p.click('#results li');
await p.fill('#nam1', 'Andreas Voigt'); await p.fill('#km1', '12');
await p.fill('#adr1', 'Beispielweg 12, 06110 Halle (Saale)');
await p.locator('#adr1').dispatchEvent('change');
await p.waitForTimeout(200);
const q = await p.textContent('#quittungen');
ok('volle Anschrift steht auf der Quittung', q.includes('Beispielweg 12, 06110 Halle (Saale)'));
ok('nicht nur die PLZ', !q.includes('Anfahrt ab'));
// fehlende Anschrift wird markiert
await p.fill('#nam2', 'Ohne Adresse'); await p.locator('#nam2').blur(); await p.waitForTimeout(200);
ok('fehlende Anschrift wird angemahnt', (await p.textContent('#quittungen')).includes('bitte eintragen'));
await p.click('#abschliessen'); await p.waitForTimeout(250);
ok('Abschließen warnt vor fehlender Anschrift', dialoge.some(d => d.includes('Anschrift von')));

// --- gemerkte Anschrift wird wieder angezeigt
await p.reload(); await p.waitForTimeout(300);
await p.fill('#q', '9606'); await p.click('#results li');
await p.fill('#nam1', 'Andreas Voigt'); await p.locator('#nam1').blur(); await p.waitForTimeout(250);
ok('hinterlegte Anschrift wird vollständig gezeigt', (await p.textContent('#plz1')).includes('Beispielweg 12'));

// --- verlegtes Spiel steht korrekt im Spielplan
await p.fill('#q', 'ChemCats'); await p.waitForTimeout(200);
const treffer = await p.textContent('#results');
ok('MDL-Spiel jetzt am 03.10.', treffer.includes('03.10.2026'));
ok('nicht mehr am 27.09.', !treffer.includes('Sa 27.09.2026'));

// --- Verlegung selbst eintragen
await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(150);
await p.click('#terminBox summary');
await p.fill('#vDatum', '2026-09-12');
await p.fill('#vZeit', '14:30');
await p.click('#vOk'); await p.waitForTimeout(250);
const kopf = await p.textContent('#game');
ok('neuer Termin im Spielkopf', kopf.includes('12.09.2026') && kopf.includes('14:30'));
ok('Vermerk auf das alte Datum', kopf.includes('ursprünglich') && kopf.includes('05.09.2026'));
ok('Kennzeichen verlegt', (await p.textContent('#tags')).includes('verlegt'));
await p.fill('#nam1', 'Test'); await p.locator('#nam1').blur(); await p.waitForTimeout(200);
ok('neuer Termin auf der Quittung', (await p.textContent('#quittungen')).includes('12.09.2026'));

// --- Spielplan im Speicher bleibt unberührt
await p.click('#weiter'); await p.waitForTimeout(150);
await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(200);
ok('Spielplan-Eintrag unverändert', (await p.textContent('#game')).includes('05.09.2026'));

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
