import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './forecast-extend.js';
const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: {
        categories: ['A', 'B', 'C'],
        series: [{ name: 'x', values: [1, 2, 3] }],
        parts: { plot: true, mark: true },
      },
    },
  ],
  rects: {
    'c.mark#0': { x: 0, y: 0, w: 1, h: 1 },
    'c.mark#1': { x: 50, y: 0, w: 1, h: 1 },
    'c.mark#2': { x: 100, y: 0, w: 1, h: 1 },
  },
  run: { role: 'step', beat: 'c', params: { duration: 1.2, fromIndex: 1 } },
  prepare(h) {
    const beat = h.beats.get('c'),
      old = beat.part('mark')[0],
      n = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    old.replaceWith(n);
    beat.parts.mark[0] = n;
    n.setAttribute('d', 'M 0 50 L 50 20 L 100 0');
    n.dataset.series = '0';
    beat
      .part('mark')
      .slice(1)
      .forEach((node, i) => {
        node.dataset.series = '0';
        node.dataset.index = String(i + 1);
      });
  },
};
it('passes contract and ends forecast point at r 9', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  scenario.prepare(h);
  const r = h.runMove(move, scenario.run);
  h.seek(r.timing.duration);
  expect(r.ctx.overlay.querySelector('path').getAttribute('d')).toContain('50 20');
  h.destroy();
});
