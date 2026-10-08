import { defineConfig } from 'vitest/config';
import { deckYaml } from './tools/vite/deck-plugin.js';

export default defineConfig({
  plugins: [deckYaml()],
  test: {
    environment: 'happy-dom',
    include: ['{engine,moves,concepts,decks,tools}/**/*.test.{js,mjs}'],
    exclude: ['**/node_modules/**', '**/__fixtures__/**', 'out/**'],
    passWithNoTests: false,
  },
});
