import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_PATTERNS } from './constants.js';
import { createRegistry } from './registry.js';
import { validateDeck } from './deck-schema.js';

const move = (id, role) => ({
  id,
  family: 'reveal',
  role,
  accepts: ['*'],
  sources: ['test'],
  reduce: 'self',
  params: {},
  timing: () => ({ duration: 1 }),
  build: () => {},
});
const registry = createRegistry([move('rise', 'enter'), move('leave', 'exit'), move('join', 'link')]);
const type = { fields: {}, primary: 'block', render: () => {} };
const concept = {
  id: 'test',
  beats: { allow: ['text', 'number', 'photo', 'quote', 'chart'] },
  moves: { allow: ['rise', 'leave', 'join'] },
  defaults: { enter: 'rise', exit: 'leave' },
};
const env = {
  registry,
  concept,
  beatTypes: { text: type, number: type, photo: type, quote: type, chart: type },
};
const deck = () => ({
  id: 'valid',
  title: 'Valid',
  lang: 'en',
  concept: 'test',
  sources: [{ id: 's1', title: 'Source', url: 'https://example.test', accessed: '2026-10-08' }],
  beats: [{ id: 'one', type: 'text' }],
});

describe('validateDeck', () => {
  it('accepts a minimal valid deck', () =>
    expect(validateDeck(deck(), env)).toEqual({ ok: true, errors: [] }));
  it('audits all thirteen placeholder patterns', () => {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      const value = pattern.source.includes('x{3')
        ? 'xxx'
        : pattern.source.includes('TODO')
          ? 'TODO'
          : pattern.source.includes('TBD')
            ? 'TBD'
            : pattern.source.includes('lorem')
              ? 'lorem'
              : pattern.source.includes('ipsum')
                ? 'ipsum'
                : pattern.source.includes('「')
                  ? '「x」'
                  : pattern.source.includes('\\?')
                    ? '???'
                    : pattern.source.includes('\\{\\{')
                      ? '{{'
                      : pattern.source.includes('\\}\\}')
                        ? '}}'
                        : pattern.source.includes('placeholder')
                          ? '<placeholder>'
                          : pattern.source.includes('자리표')
                            ? '자리표'
                            : pattern.source.includes('예시')
                              ? '예시 문구'
                              : '   ';
      const d = deck();
      d.title = value;
      expect(validateDeck(d, env).ok).toBe(false);
    }
  });
  it('requires ledger sources, override, repeat intent, and a non-final link', () => {
    const d = deck();
    d.beats = [
      { id: 'one', type: 'number' },
      { id: 'two', type: 'photo', source: 'missing' },
      { id: 'three', type: 'text', link: { move: 'join' } },
    ];
    const messages = validateDeck(d, env)
      .errors.map((x) => x.message)
      .join(' ');
    expect(messages).toMatch(/source is required/);
    expect(messages).toMatch(/not in deck.sources/);
    expect(messages).toMatch(/last beat cannot have link/);
    const outside = deck();
    outside.beats[0].enter = { move: 'engine:fade-in' };
    expect(validateDeck(outside, env).ok).toBe(true);
    const repeats = deck();
    repeats.beats.push({ id: 'two', type: 'text' });
    expect(validateDeck(repeats, env).errors.some((x) => x.message.includes('repeats'))).toBe(true);
  });
});
