import { describe, expect, it } from 'vitest';
import registry from './index.js';
import { readFileSync } from 'node:fs';

const catalog = readFileSync(new URL('../plan/moves.catalog.jsonl', import.meta.url), 'utf8');

const catalogIds = catalog
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line).id);

describe('move registry', () => {
  it('builds and every merged move is in the catalog', () => {
    const ids = registry.ids();
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids.filter((id) => !id.startsWith('engine:'))) expect(catalogIds).toContain(id);
  });
});
