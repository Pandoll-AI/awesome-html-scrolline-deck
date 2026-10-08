import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './diverge-grow.js';

const scenario = {
  beats: [
    {
      id: 'c',
      type: 'chart',
      data: { orient: 'v', parts: { mark: true, label: true, plot: true, title: true } },
    },
  ],
  rects: { 'c.mark#0': { x: 0, y: 0, w: 10, h: 10 }, 'c.mark#1': { x: 20, y: 0, w: 10, h: 10 } },
  run: { role: 'enter', beat: 'c', params: { duration: 1.4 } },
  prepare(h) {
    h.beats.get('c').part('mark')[0].dataset.sign = 'neg';
    h.beats.get('c').part('mark')[1].dataset.sign = 'pos';
  },
};
it('passes contract and starts negative bars first', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario);
  scenario.prepare(h);
  const r = h.runMove(move, scenario.run);
  h.seek(0.3);
  const marks = h.beats.get('c').part('mark');
  expect(Number(r.ctx.gsap.getProperty(marks[0], 'scaleY'))).toBeGreaterThan(
    Number(r.ctx.gsap.getProperty(marks[1], 'scaleY')),
  );
  h.destroy();
});
