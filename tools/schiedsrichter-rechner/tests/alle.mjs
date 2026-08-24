/* Führt alle Suiten nacheinander aus und meldet das Ergebnis gesammelt.
   Aufruf aus diesem Verzeichnis:  node alle.mjs                         */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const dateien = readdirSync(new URL('.', import.meta.url))
  .filter(d => d.endsWith('.mjs') && !['alle.mjs', 'hilfe.mjs'].includes(d)).sort();

let fehlschlaege = 0, geprueft = 0;
for (const d of dateien) {
  const lauf = spawnSync(process.execPath, [new URL(d, import.meta.url).pathname],
                         { encoding: 'utf8' });
  const ausgabe = (lauf.stdout || '') + (lauf.stderr || '');
  if (/Cannot find package 'playwright'/.test(ausgabe)) {
    console.error('Playwright fehlt. Entweder "npm i playwright" in diesem Verzeichnis' +
                  ' oder NODE_PATH auf die globale Installation setzen:\n' +
                  '  NODE_PATH=$(npm root -g) node alle.mjs');
    process.exit(2);
  }
  const ok = (ausgabe.match(/^OK /gm) || []).length;
  const fail = (ausgabe.match(/^FAIL /gm) || []).length;
  const fehler = /JS-FEHLER/.test(ausgabe);
  geprueft += ok + fail;
  fehlschlaege += fail + (fehler ? 1 : 0);
  console.log(`${fail || fehler ? 'FEHLER' : '  ok  '}  ${d.padEnd(34)} ${ok} geprüft` +
              (fail ? `, ${fail} fehlgeschlagen` : '') + (fehler ? ', JS-Fehler' : ''));
  if (fail || fehler) console.log(ausgabe.split('\n').filter(z => /^FAIL|JS-FEHLER/.test(z)).map(z => '        ' + z).join('\n'));
}
console.log(`\n${dateien.length} Suiten, ${geprueft} Prüfungen, ${fehlschlaege} Fehlschläge`);
process.exit(fehlschlaege ? 1 : 0);
