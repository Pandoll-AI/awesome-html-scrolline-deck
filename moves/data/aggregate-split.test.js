import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './aggregate-split.js';

const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        series: [{ values: [10, 20, 30] }],
        parts: { plot: true, mark: true, title: true, dek: true, note: true },
      },
    },
  ],
  rects: {
    'c.plot': { x: 100, y: 100, w: 300, h: 300 },
    'c.mark#0': { x: 100, y: 350, w: 20, h: 50 },
    'c.mark#1': { x: 240, y: 300, w: 20, h: 100 },
    'c.mark#2': { x: 380, y: 250, w: 20, h: 150 },
  },
  run: { role: 'enter', beat: 'c', params: { duration: 1.6, totalLabel: true } },
};

it('passes the contract and partitions the aggregate height exactly', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  const result = h.runMove(move, scenario.run);
  const pieces = [...result.ctx.overlay.querySelectorAll('rect')];
  const aggregate = Number(pieces[0].getAttribute('height'));
  expect(pieces.slice(1).reduce((sum, node) => sum + Number(node.getAttribute('height')), 0)).toBeCloseTo(
    aggregate,
  );
  h.destroy();
});
