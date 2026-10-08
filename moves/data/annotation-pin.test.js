import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './annotation-pin.js';
const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        notes: [
          { index: 0, text: 'A' },
          { index: 1, text: 'B' },
        ],
        parts: { plot: true, mark: true, note: true },
      },
    },
  ],
  rects: { 'c.mark#0': { x: 0, y: 10, w: 10, h: 10 }, 'c.mark#1': { x: 40, y: 10, w: 10, h: 10 } },
  run: { role: 'step', beat: 'c', params: { duration: 0.9, stagger: 0.08 } },
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
it('passes contract and creates ordered annotations', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  scenario.prepare(h);
  h.runMove(move, scenario.run);
  expect(h.stage.overlay.querySelectorAll('span')).toHaveLength(2);
  h.destroy();
});
