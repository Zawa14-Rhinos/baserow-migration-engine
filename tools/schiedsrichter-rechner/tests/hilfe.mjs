/* Findet Playwright sowohl lokal installiert als auch in der globalen
   Installation (dort hilft NODE_PATH, das ESM-Importe allein ignorieren). */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require('playwright');
} catch (e) {
  console.error('Playwright nicht gefunden. Entweder "npm i playwright" in diesem Verzeichnis\n' +
                'oder die globale Installation nutzen:  NODE_PATH=$(npm root -g) node alle.mjs');
  process.exit(2);
}

export const chromium = pw.chromium;
export const SEITE = new URL('../index.html', import.meta.url).href;
