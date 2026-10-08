import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './glyph-to-bar.js';
const scenario = {
  beats: [
    { id: 'a', type: 'video', data: { value: 42 } },
    { id: 'b', type: 'chart', data: {} },
  ],
  rects: {
    'a.frame': { x: 0, y: 0, w: 800, h: 450 },
    'a.caption': { x: 0, y: 460, w: 100, h: 30 },
    'b.mark#0': { x: 900, y: 300, w: 60, h: 400 },
    'b.mark#1': { x: 1000, y: 350, w: 60, h: 350 },
    'b.axis': { x: 100, y: 700, w: 1000, h: 2 },
    'b.title': { x: 100, y: 50, w: 300, h: 40 },
  },
  run: { role: 'link', from: 'a', beat: 'b' },
};
scenario.nodes = (_h, ctx) => [ctx.handoff.from.node, ctx.handoff.to.node];
it('meets the chart handoff contract and ends with target inset', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
});
