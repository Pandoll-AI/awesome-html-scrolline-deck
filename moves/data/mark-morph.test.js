import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './mark-morph.js';

const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        series: [{ values: [20, 40] }],
        states: [{ name: 'line', series: [{ values: [25, 75] }] }],
        parts: { plot: true, mark: true, title: true, dek: true, axis: true, unit: true },
      },
    },
  ],
  rects: {
    'c.plot': { x: 100, y: 100, w: 400, h: 200 },
    'c.mark#0': { x: 100, y: 200, w: 30, h: 100 },
    'c.mark#1': { x: 470, y: 150, w: 30, h: 150 },
  },
  run: { role: 'step', beat: 'c', step: { name: 'line' }, params: { duration: 1.8, rollTicks: true } },
};

it('passes the contract and places the last point at its new value y', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  const result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration);
  const dots = result.ctx.overlay.querySelectorAll('circle');
  expect(Number(dots[1].getAttribute('cy'))).toBe(100);
  h.destroy();
});

it('does not roll ticks in reduced motion', () => {
  const h = createHarness({ ...scenario, reduce: true });
  const result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration / 2);
  expect(Number(result.ctx.gsap.getProperty(h.beats.get('c').part('axis')[0], 'yPercent'))).toBe(0);
  h.destroy();
});
