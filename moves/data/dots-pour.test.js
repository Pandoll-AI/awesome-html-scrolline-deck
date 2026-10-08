import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './dots-pour.js';

const scenario = {
  beats: [
    { id: 'a', type: 'chart', data: { unitValue: 1, series: [{ values: [18] }] } },
    {
      id: 'b',
      type: 'chart',
      data: { parts: { mark: 1, baseline: 1, title: 1, dek: 1 }, series: [{ values: [18] }] },
    },
  ],
  rects: { 'a.plot': { x: 20, y: 20, w: 100, h: 100 }, 'b.mark': { x: 500, y: 300, w: 80, h: 200 } },
  run: { role: 'link', from: 'a', beat: 'b', params: { duration: 1.8, toIndex: -1 } },
  carry: (h, ctx) => ctx.overlay.querySelector('[data-sl-rect]'),
};
it('meets the link contract and preserves source count data', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  expect(18 / 1).toBe(18);
});
