import { afterEach, describe, expect, it } from 'vitest';
import { transferVars } from './handoff.js';
import { createRegistry } from './registry.js';
import { createHarness } from './testing.js';

const enter = {
  id: 'test-enter',
  family: 'emphasis',
  role: 'enter',
  accepts: ['*'],
  sources: ['test-source'],
  reduce: 'self',
  params: { duration: { type: 'number', default: 0.5, doc: 'Duration for harness test' } },
  timing: (params) => ({ duration: params.duration }),
  build(tl, ctx, params) {
    const node = ctx.beat.part('block');
    ctx.initial(node, { autoAlpha: 0, x: 0 });
    tl.to(node, { autoAlpha: 1, x: 40, duration: params.duration }, 0);
  },
};
const link = {
  id: 'test-link',
  family: 'emphasis',
  role: 'link',
  accepts: ['*'],
  sources: ['test-source'],
  reduce: 'self',
  params: {},
  timing: () => ({ duration: 0.5 }),
  build(tl, ctx) {
    const from = ctx.handoff.from.node,
      to = ctx.handoff.to.node;
    ctx.initial(to, { autoAlpha: 0 });
    tl.to(from, { ...transferVars(ctx.handoff.from.rect, ctx.handoff.to.rect), duration: 0.5 }, 0);
    tl.set(to, { autoAlpha: 1 }, 0.5);
    tl.set(from, { autoAlpha: 0 }, 0.5);
  },
};
const ambient = {
  id: 'test-ambient',
  family: 'emphasis',
  role: 'ambient',
  accepts: ['*'],
  sources: ['test-source'],
  reduce: 'self',
  params: {},
  timing: () => ({ duration: 'fill' }),
  build(tl, ctx) {
    const node = ctx.beat.part('block');
    ctx.initial(node, { x: 0 });
    tl.to(node, { x: ctx.reduce ? 0 : 10, duration: ctx.duration }, 0);
  },
};

const harnesses = [];
function harness(reduce = false) {
  const value = createHarness({
    beats: [
      { id: 'a', type: 'text', data: {} },
      { id: 'b', type: 'text', data: {} },
    ],
    reduce,
    rects: { 'a.block': { x: 10, y: 20, w: 40, h: 50 }, 'b.block': { x: 110, y: 70, w: 100, h: 25 } },
  });
  harnesses.push(value);
  return value;
}
afterEach(() => harnesses.splice(0).forEach((value) => value.destroy()));

describe('move testing harness', () => {
  it('기본 params·순수 timing·local timeline 길이를 검증할 수 있다', () => {
    const h = harness(),
      one = h.runMove(enter, { role: 'enter', beat: 'a' }),
      two = h.runMove(enter, { role: 'enter', beat: 'a' });
    expect(createRegistry([enter]).get('test-enter')).toBe(enter);
    expect(one.timing).toEqual(two.timing);
    expect(one.timing.duration).toBeGreaterThan(0);
    expect(one.tl.duration()).toBeLessThanOrEqual(one.timing.duration + 0.001);
  });

  it('seek는 결정론적이고 되감으면 initial inline state로 돌아간다', () => {
    const h = harness(),
      result = h.runMove(enter, { role: 'enter', beat: 'a' }),
      node = result.ctx.beat.part('block')[0];
    h.seek(0.25);
    const first = h.snapshot([node], ['x', 'opacity']);
    h.seek(0.5);
    h.seek(0.25);
    expect(h.snapshot([node], ['x', 'opacity'])).toEqual(first);
    h.seek(0.5);
    h.seek(0);
    expect(h.snapshot([node], ['x', 'opacity'])[0].props.x).toBe(0);
  });

  it('link는 끝에서 target을 보이고 source를 target rect로 운반한다', () => {
    const h = harness(),
      result = h.runMove(link, { role: 'link', beat: 'b', from: 'a' }),
      from = result.ctx.handoff.from.node,
      to = result.ctx.handoff.to.node;
    h.seek(0.5);
    expect(Number(result.ctx.gsap.getProperty(to, 'opacity'))).toBe(1);
    expect(Number(result.ctx.gsap.getProperty(from, 'opacity'))).toBe(0);
    const moved = from.getBoundingClientRect();
    expect([moved.left, moved.top, moved.width, moved.height]).toEqual([110, 70, 100, 25]);
  });

  it('ambient fill과 reduced-motion self move도 같은 paused master에서 동작한다', () => {
    const h = harness(true),
      result = h.runMove(ambient, { role: 'ambient', beat: 'a' });
    h.seek(1);
    expect(result.timing.duration).toBe(1);
    expect(Number(result.ctx.gsap.getProperty(result.ctx.beat.part('block')[0], 'x'))).toBe(0);
  });
});
