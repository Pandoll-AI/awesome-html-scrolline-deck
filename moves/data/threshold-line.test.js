import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './threshold-line.js';
const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        categories: ['A', 'B'],
        series: [{ name: 'x', values: [2, 5] }],
        highlight: { series: 0, index: 1 },
        parts: { plot: true, mark: true },
      },
    },
  ],
  rects: { 'c.mark#0': { x: 0, y: 0, w: 10, h: 10 }, 'c.mark#1': { x: 20, y: 0, w: 10, h: 10 } },
  run: { role: 'step', beat: 'c', params: { duration: 1, refIndex: 1 } },
  prepare(h) {
    h.beats
      .get('c')
      .part('mark')
      .forEach((n, i) => {
        n.dataset.index = String(i);
        n.dataset.series = '0';
      });
  },
};
it('passes contract and mutes only marks under the reference', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  scenario.prepare(h);
  const r = h.runMove(move, scenario.run);
  h.seek(r.timing.duration);
  expect(h.beats.get('c').part('mark')[0].style.fill).not.toBe(h.beats.get('c').part('mark')[1].style.fill);
  h.destroy();
});
