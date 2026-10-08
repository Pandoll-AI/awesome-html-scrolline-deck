import { afterEach, describe, expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './port-aim.js';

const scenario = {
  beats: [{ id: 'p', type: 'photo', data: { parts: { caption: true, hud: true } } }],
  rects: {
    'p.frame': { x: 100, y: 100, w: 300, h: 200 },
    'p.caption': { x: 110, y: 320, w: 100, h: 20 },
    'p.hud': { x: 0, y: 0, w: 10, h: 10 },
  },
  run: { role: 'step', beat: 'p', params: { part: 'frame', label: '−27%', duration: 1.2 } },
  concept: { tokens: { dimOthers: 0.22, ringPad: 12 } },
};
const hs = [];
afterEach(() => hs.splice(0).forEach((h) => h.destroy()));
describe('port-aim', () => {
  it('meets the move contract', () => expect(checkMove(move, scenario, createHarness)).toEqual([]));
  it('ends at the padded port radius and dims other parts', () => {
    const h = createHarness(scenario);
    hs.push(h);
    const r = h.runMove(move, scenario.run);
    h.seek(r.timing.duration);
    const circle = r.ctx.overlay.querySelector('circle');
    expect(Number(circle.getAttribute('r'))).toBeCloseTo(Math.hypot(300, 200) / 2 + 12);
    expect(Number(r.ctx.gsap.getProperty(h.beats.get('p').part('caption')[0], 'opacity'))).toBeCloseTo(0.22);
  });
});
