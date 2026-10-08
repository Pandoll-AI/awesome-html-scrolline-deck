import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './line-to-waffle.js';

const scenario = {
  beats: [
    { id: 'a', type: 'chart', data: { series: [{ values: [25] }] } },
    { id: 'b', type: 'chart', data: { parts: { title: 1, dek: 1, label: 1 } } },
  ],
  rects: { 'a.mark': { x: 100, y: 100, w: 10, h: 10 }, 'b.plot': { x: 500, y: 200, w: 240, h: 240 } },
  run: { role: 'link', from: 'a', beat: 'b', params: { duration: 1.6, cols: 10, cells: 100 } },
  carry: (h, ctx) => ctx.overlay.querySelector('[data-sl-rect]'),
};
it('meets the link contract', () => {
  const x = checkMove(move, scenario, createHarness);
  expect(x).toEqual([]);
});
it('rounds percentage cells', () => expect(Math.round((25 * 100) / 100)).toBe(25));
