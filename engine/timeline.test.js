import { describe, expect, it } from 'vitest';
import simple from './__fixtures__/decks/simple.json';
import linked from './__fixtures__/decks/link.json';
import rich from './__fixtures__/decks/steps-camera-ambient.json';
import { plan } from './timeline.js';
import { build } from './timeline.js';
import { createRegistry } from './registry.js';
import { gsap } from 'gsap';

const move = (id, role, duration = 1, stops = []) => ({
  id,
  family: 'reveal',
  role,
  accepts: ['*'],
  sources: ['test'],
  reduce: 'self',
  params: { duration: { type: 'number', default: duration, doc: 'duration' } },
  timing: (p) => ({ duration: p.duration, stops }),
  build: () => {},
});
const registry = createRegistry([
  move('enter', 'enter'),
  move('exit', 'exit'),
  move('link', 'link'),
  move('step', 'step', 0.5),
  move('camera', 'camera', 2),
  { ...move('ambient', 'ambient'), timing: () => ({ duration: 'fill' }) },
]);
const concept = { id: 'test', timing: {}, defaults: { enter: 'enter', exit: 'exit' }, tokens: {}, eases: {} };
const env = { registry, concept, beatTypes: {} };

describe('plan', () => {
  it('matches hand calculated fixture stops', () => {
    expect(plan(simple, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['open', 1],
      ['close', 2.8],
    ]);
    expect(plan(linked, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['one', 1],
      ['two', 3.6],
    ]);
    expect(plan(rich, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['one', 2],
      ['one/more', 3.1],
      ['two', 4.9],
    ]);
  });
  it('maintains C6 map invariants and is input deterministic', () => {
    const map = plan(rich, env);
    expect(map).toEqual(plan(rich, env));
    expect(map.stops.map((x) => x.t)).toEqual([...map.stops.map((x) => x.t)].sort((a, b) => a - b));
    expect(new Set(map.stops.map((x) => x.name)).size).toBe(map.stops.length);
    expect(map.beats.every((b, i) => !i || b.start >= map.beats[i - 1].start)).toBe(true);
    expect(map.beats.flatMap((b) => b.spans).every((s) => s.start <= s.end)).toBe(true);
  });
  it('keeps planning unchanged for reduce fallback and rejects an overlong local timeline', () => {
    const fade = { ...move('fade', 'enter'), reduce: 'fade' };
    const bad = { ...move('bad', 'enter'), build: (tl) => tl.to({}, { duration: 2 }) };
    const r = createRegistry([fade, bad, move('leave', 'exit')]);
    const d = {
      ...simple,
      beats: [{ id: 'open', type: 'text', enter: { move: 'fade' }, exit: { move: 'leave' } }],
    };
    const map = plan(d, { ...env, registry: r });
    expect(JSON.stringify(map)).toBe(JSON.stringify(plan(d, { ...env, registry: r })));
    const root = document.createElement('div');
    const stage = {
      root,
      viewport: {},
      placeBeat: (node) => root.append(node),
      overlayFor: () => document.createElement('div'),
    };
    const beatTypes = {
      text: {
        primary: 'block',
        render: () => {
          const node = document.createElement('section');
          const part = document.createElement('span');
          part.dataset.part = 'block';
          node.append(part);
          return { root: node, parts: { block: [part] } };
        },
      },
    };
    expect(() =>
      build(map, {
        stage,
        deck: d,
        registry: r,
        concept,
        beatTypes,
        reduce: true,
        gsap,
        measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
      }),
    ).not.toThrow();
    const badDeck = { ...d, beats: [{ ...d.beats[0], enter: { move: 'bad' } }] };
    const badMap = plan(badDeck, { ...env, registry: r });
    expect(() =>
      build(badMap, {
        stage,
        deck: badDeck,
        registry: r,
        concept,
        beatTypes,
        reduce: false,
        gsap,
        measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
      }),
    ).toThrow(/exceeds/);
  });
});
