import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './establish-crane.js';

const scenario = {
  beats: [{ id: 'b', type: 'text', data: {}, place: { world: { x: 1, y: 2, s: 1 } } }],
  run: {
    role: 'camera',
    beat: 'b',
    params: { duration: 2.4, tilt: 10, startScale: 1.6, lift: 0.35, haze: 0.5 },
  },
  concept: { eases: { inout: 'power2.inOut', out: 'power3.out' } },
};
it('cranes from its tilted start to a level target', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario),
    result = h.runMove(move, scenario.run);
  h.seek(0);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'rx'))).toBe(10);
  h.seek(result.timing.duration);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'rx'))).toBe(0);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'scale'))).toBe(1);
  h.destroy();
});
