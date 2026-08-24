import { chromium, SEITE } from './hilfe.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));
p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
p.on('dialog', d => d.accept());
const ok = (n, v) => console.log((v ? 'OK   ' : 'FAIL ') + n);
await p.goto(SEITE);

// --- alle Abschnitte von Anfang an da
for (const s of ['s2','s3','s4','s5'])
  ok(`${s} ist ohne Spielauswahl sichtbar`, !(await p.locator('#' + s).isHidden()));

// --- Leiste springt frei, auch rückwärts und vorwärts
for (const z of ['s5','s3','s4','s1']) {
  await p.click(`#fortschritt button[data-ziel="${z}"]`);
  await p.waitForTimeout(600);
  const drin = await p.evaluate(id => {
    const r = document.getElementById(id).getBoundingClientRect();
    return r.top > -80 && r.top < window.innerHeight;
  }, z);
  ok(`Sprung zu ${z} funktioniert ohne Vorbedingung`, drin);
}

// --- Namen vor der Spielauswahl eintragen
await p.fill('#nam1', 'Andreas Voigt');
await p.fill('#adr1', 'Beispielweg 12, 06110 Halle');
await p.locator('#adr1').dispatchEvent('change');
await p.fill('#km1', '12');
await p.waitForTimeout(200);
ok('Lizenzstufen ohne Spiel generisch', (await p.locator('#lic1 option').allTextContents()).join('|') === 'LSE|LSD|LSC oder höher');
ok('Hinweis, dass Beträge folgen', !(await p.locator('#s3Hinweis').isHidden()));
ok('Quittung zeigt Platzhalter', (await p.textContent('#quittungen')).includes('Sobald ein Spiel gewählt ist'));
ok('Lückenliste nennt die Spielauswahl', (await p.textContent('#luecken')).includes('Spiel auswählen'));

// --- danach Spiel wählen: Eingaben bleiben erhalten
await p.fill('#q', '9606'); await p.click('#results li'); await p.waitForTimeout(300);
ok('Name überlebt die Spielauswahl', (await p.inputValue('#nam1')) === 'Andreas Voigt');
ok('Kilometer überleben', (await p.inputValue('#km1')) === '12');
ok('Anschrift überlebt', (await p.textContent('#plz1')).includes('Beispielweg 12'));
ok('Beträge stehen jetzt an den Stufen', (await p.locator('#lic1 option').allTextContents()).join('|').includes('€'));
ok('Hinweis verschwindet', await p.locator('#s3Hinweis').isHidden());
ok('Quittung ist da', (await p.textContent('#quittungen')).includes('Andreas Voigt'));
console.log('     Summe:', await p.textContent('#sum'));

// --- zurück auf Anfang: Felder bleiben nutzbar
await p.click('#neueAbrechnung').catch(() => {});
await p.waitForTimeout(200);
for (const s of ['s2','s3','s4','s5'])
  ok(`${s} bleibt nach Zurücksetzen sichtbar`, !(await p.locator('#' + s).isHidden()));

console.log(fehler.length ? 'JS-FEHLER: ' + fehler.join(' / ') : 'keine JS-Fehler');
await b.close();
