import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './waffle-recount.js';

const data = { series: [{ values: [25, 5] }], states: [{ name: '1', series: [{ values: [25, 5] }] }] };
const scenario = {
  beats: [{ id: 'c', type: 'chart', data }],
  rects: { 'c.plot': { x: 100, y: 100, w: 300, h: 300 } },
  run: { role: 'step', beat: 'c', params: { duration: 1.2, index: 1 } },
};
it('meets the move contract', () => expect(checkMove(move, scenario, createHarness)).toEqual([]));
it('uses reverse ordering when the value declines', () =>
  expect([...Array(20)].map((_, i) => 20 - i).slice(0, 3)).toEqual([20, 19, 18]));
