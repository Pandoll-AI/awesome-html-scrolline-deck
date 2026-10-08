import { describe, expect, it, vi } from 'vitest';
import { computeViewport, createStage } from './stage.js';

describe('stage', () => {
  it.each([
    [1920, 1080, false, 1],
    [390, 844, true, 390 / 760],
    [1280, 1024, false, 1280 / 1920],
  ])('computes %ix%i viewport', (w, h, portrait, px) => {
    expect(computeViewport(w, h, 3)).toMatchObject({ w, h, portrait, px, dpr: 2 });
  });
  it('places slot and world beats and clamps camera tilt', () => {
    const host = document.createElement('div');
    const viewport = computeViewport(1920, 1080);
    const stage = createStage(host, { viewport, concept: { id: 'rail' } });
    const slot = document.createElement('section'),
      world = document.createElement('section');
    stage.placeBeat(slot, { slot: 'lower-third' });
    stage.placeBeat(world, { world: { x: 1, y: 0.5, z: 40, s: 2 } });
    expect(slot.classList.contains('sl-slot-lower-third')).toBe(true);
    expect(stage.screen.contains(slot)).toBe(true);
    expect(world.classList.contains('sl-place-world')).toBe(true);
    expect(world.style.left).toBe('1920px');
    expect(stage.world.contains(world)).toBe(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vars = stage.cameraVars({ x: 1, y: 0.5, s: 2, rx: 20, ry: -20 });
    expect(vars).toMatchObject({
      x: -2880,
      y: -540,
      scale: 2,
      rotationX: 12,
      rotationY: -12,
      transformOrigin: '0 0',
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
