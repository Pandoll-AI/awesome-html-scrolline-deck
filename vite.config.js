import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { deckYaml } from './tools/vite/deck-plugin.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** decks/<id>/index.html 전부(SCROLLINE_DECK가 있으면 그 덱 하나) → 다중 페이지 입력 */
function deckInputs() {
  const only = process.env.SCROLLINE_DECK;
  const dir = path.join(ROOT, 'decks');
  const ids = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'index.html'))) : [];
  return Object.fromEntries(ids.filter((d) => !only || d === only).map((d) => [d, path.join(dir, d, 'index.html')]));
}

export default defineConfig({
  root: ROOT,
  base: './',
  plugins: [deckYaml()],
  define: { 'import.meta.env.SCROLLINE_MODE': JSON.stringify(process.env.SCROLLINE_MODE || 'live') },
  build: {
    outDir: process.env.SCROLLINE_OUT || path.join(ROOT, 'out', 'build'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: deckInputs() },
  },
});
