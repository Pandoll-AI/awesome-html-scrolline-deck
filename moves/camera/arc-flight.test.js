import { expect, it } from 'vitest';
import { createHarness } from '../../engine/testing.js';
import { checkMove } from '../_shared/contract-check.js';
import move from './arc-flight.js';

const scenario = {
  beats: [
    { id: 'a', type: 'text', data: {}, place: { world: { x: 0, y: 0, s: 1 } } },
    { id: 'b', type: 'text', data: {}, place: { world: { x: 2, y: 1, s: 1 } } },
  ],
  run: {
    role: 'camera',
    beat: 'b',
    params: { duration: 1.8, altitude: 0.32, bank: 5, parallax: 0.35, settle: 0.12, ease: 'flight' },
  },
  concept: { eases: { flight: 'power2.inOut', inout: 'power2.inOut', out: 'power3.out' } },
};
it('flies to the target and leaves the camera level', () => {
  expect(checkMove(move, scenario, createHarness)).toEqual([]);
  const h = createHarness(scenario),
    result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration);
  expect(h.stage.cameraVars(result.ctx.camera)).toMatchObject({
    x: Number(result.ctx.gsap.getProperty(h.stage.camera, 'x')),
    y: Number(result.ctx.gsap.getProperty(h.stage.camera, 'y')),
    s: Number(result.ctx.gsap.getProperty(h.stage.camera, 'scale')),
  });
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'rx'))).toBe(0);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'ry'))).toBe(0);
  h.destroy();
});
it('turns a short hop into a level glide', () => {
  const h = createHarness({
    ...scenario,
    beats: [
      { id: 'a', type: 'text', data: {}, place: { world: { x: 0, y: 0, s: 1 } } },
      { id: 'b', type: 'text', data: {}, place: { world: { x: 0.2, y: 0.1, s: 1 } } },
    ],
  });
  const result = h.runMove(move, scenario.run);
  h.seek(result.timing.duration * 0.3);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'rx'))).toBe(0);
  expect(Number(result.ctx.gsap.getProperty(h.stage.camera, 'ry'))).toBe(0);
  h.destroy();
});
