import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './iris-to-dot.js';
const scenario = {
  beats: [
    { id: 'a', type: 'video', data: {} },
    { id: 'b', type: 'chart', data: {} },
  ],
  rects: {
    'a.frame': { x: 0, y: 0, w: 1200, h: 700 },
    'b.mark#0': { x: 900, y: 300, w: 20, h: 20 },
    'b.axis': { x: 100, y: 700, w: 900, h: 2 },
    'b.title': { x: 100, y: 40, w: 300, h: 50 },
  },
  run: { role: 'link', from: 'a', beat: 'b' },
};
scenario.nodes = (_h, ctx) => [ctx.handoff.from.node, ctx.handoff.to.node];
it('meets the iris link contract', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
});
