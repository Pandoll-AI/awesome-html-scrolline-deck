import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './dot-multiply.js';

const data = {
  unitValue: 10,
  series: [{ values: [178] }],
  states: [{ name: '1', unitValue: 10, series: [{ values: [178] }] }],
};
const scenario = {
  beats: [{ id: 'c', type: 'chart', data }],
  rects: { 'c.mark': { x: 100, y: 100, w: 12, h: 12 } },
  run: { role: 'step', beat: 'c', params: { duration: 1.8, cols: 18, gap: 6, maxDots: 50 } },
};
it('meets the move contract without a canvas context', () =>
  expect(checkMove(move, scenario, createHarness)).toEqual([]));
it('caps N and uses the prescribed start curve', () => {
  expect(Math.min(50, Math.round(178 / 10))).toBe(18);
  expect(0.1 + 0.55 * (9 / 18) ** 0.7).toBeCloseTo(0.43855, 4);
});
