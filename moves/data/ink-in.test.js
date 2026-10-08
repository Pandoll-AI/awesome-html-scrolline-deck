import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './ink-in.js';
const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        categories: ['A', 'B', 'C'],
        series: [{ name: 'x', values: [1, 2, 3] }],
        parts: { plot: true, axis: true, mark: true },
      },
    },
  ],
  rects: { 'c.mark#0': { x: 0, y: 0, w: 1, h: 1 } },
  run: { role: 'enter', beat: 'c', params: { duration: 1.2, upto: 1 } },
  prepare(h) {
    const beat = h.beats.get('c'),
      old = beat.part('mark')[0],
      p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    old.replaceWith(p);
    beat.parts.mark[0] = p;
    p.setAttribute('d', 'M 0 0 L 50 0 L 100 0');
  },
};
it('passes contract and limits ink to upto', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  scenario.prepare(h);
  const r = h.runMove(move, scenario.run);
  h.seek(r.timing.duration);
  expect(r.ctx.overlay.querySelectorAll('path')[1].style.strokeDashoffset).toBe('0.3333');
  h.destroy();
});
