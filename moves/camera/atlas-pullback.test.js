import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './atlas-pullback.js';

const scenario = {
  beats: [{ id: 'b', type: 'text', data: {}, place: { world: { x: 2, y: 1, s: 1 } } }],
  run: {
    role: 'camera',
    beat: 'b',
    params: { duration: 3.2, bounds: { x0: -0.6, y0: -0.6, x1: 6, y1: 4.6 }, margin: 0.06, tilt: 6 },
  },
  concept: { eases: { inout: 'power2.inOut', out: 'power3.out' } },
};
it('fits the declared atlas bounds and settles level', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario),
    result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'scale'))).toBeCloseTo((1 / 6.6) * 0.94);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'rx'))).toBe(0);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'ry'))).toBe(0);
  h.destroy();
});
