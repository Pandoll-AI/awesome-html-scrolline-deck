import { afterEach, describe, expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './recede.js';
const scenario = {
  beats: [{ id: 'c', type: 'chart', data: { parts: { title: true, mark: true } } }],
  rects: {
    'c.plot': { x: 100, y: 100, w: 400, h: 300 },
    'c.title': { x: 100, y: 60, w: 400, h: 20 },
    'c.mark': { x: 120, y: 200, w: 10, h: 50 },
  },
  run: { role: 'exit', beat: 'c', params: { to: 0.22, scaleTo: 0.985, duration: 0.9 } },
};
const hs = [];
afterEach(() => hs.splice(0).forEach((h) => h.destroy()));
describe('recede', () => {
  it('meets the move contract', () => expect(checkMove(move, scenario, createHarness)).toEqual([]));
  it('keeps the canvas preset opacity without blur', () => {
    const h = createHarness(scenario);
    hs.push(h);
    const r = h.runMove(move, scenario.run);
    h.seek(r.timing.duration);
    expect(Number(r.ctx.gsap.getProperty(h.beats.get('c').part('plot')[0], 'opacity'))).toBeCloseTo(0.22);
    expect(h.beats.get('c').part('plot')[0].style.filter).not.toContain('blur');
  });
});
