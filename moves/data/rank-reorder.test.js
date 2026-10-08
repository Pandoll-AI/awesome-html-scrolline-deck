import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './rank-reorder.js';

const scenario = {
  beats: [
    {
      id: 'a',
      type: 'chart',
      data: { categories: ['Alpha', 'Bravo'], parts: { mark: true, label: true, axis: true } },
    },
    {
      id: 'b',
      type: 'chart',
      data: {
        categories: ['Bravo', 'Alpha', 'New'],
        parts: { mark: true, label: true, axis: true, title: true, dek: true },
      },
    },
  ],
  rects: {
    'a.mark#0': { x: 20, y: 200, w: 30, h: 100 },
    'a.mark#1': { x: 80, y: 250, w: 30, h: 50 },
    'a.label#0': { x: 20, y: 320, w: 30, h: 20 },
    'a.label#1': { x: 80, y: 320, w: 30, h: 20 },
    'b.mark#0': { x: 200, y: 220, w: 30, h: 80 },
    'b.mark#1': { x: 260, y: 180, w: 30, h: 120 },
    'b.mark#2': { x: 320, y: 240, w: 30, h: 60 },
    'b.label#0': { x: 200, y: 320, w: 30, h: 20 },
    'b.label#1': { x: 260, y: 320, w: 30, h: 20 },
    'b.label#2': { x: 320, y: 320, w: 30, h: 20 },
  },
  run: { role: 'link', from: 'a', beat: 'b', params: { duration: 1.6, matchBy: 'label' } },
};

it('passes the contract and grows an unmatched destination bar', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  const result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration * 0.6);
  expect(Number(result.ctx.gsap.getProperty(h.beats.get('b').part('mark')[2], 'scaleY'))).toBeGreaterThan(0);
  h.destroy();
});
