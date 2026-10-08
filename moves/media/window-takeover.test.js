import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './window-takeover.js';
const scenario = {
  beats: [{ id: 'm', type: 'photo', data: {} }],
  rects: {
    'm.frame': { x: 0, y: 0, w: 400, h: 200 },
    'm.media': { x: 0, y: 0, w: 400, h: 200 },
    'm.caption': { x: 0, y: 0, w: 100, h: 20 },
  },
  run: { role: 'step', beat: 'm', params: { duration: 1.2 } },
};
it('meets the move contract and removes the frame radius', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness({ beats: scenario.beats, rects: scenario.rects });
  const r = h.runMove(move, scenario.run);
  h.seek(r.timing.duration);
  expect(r.ctx.gsap.getProperty(r.ctx.beat.part('frame')[0], 'borderRadius')).toBe(0);
  h.destroy();
});
