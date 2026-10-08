import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// 실제 브라우저(tools/smoke.mjs rail-ai-decade)에서 드러난 배치 회귀.
const css = readFileSync('engine/engine.css', 'utf8');
const rule = (selector) => {
  const at = css.indexOf(`${selector} {`);
  return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
};

it('lets the counter reel stack ten digits instead of stretching to one line', () => {
  expect(rule('.sl-chronology__counter')).toMatch(/align-items:\s*flex-start/);
  expect(rule('.sl-chronology__counter')).toMatch(/overflow:\s*hidden/);
  expect(rule('.sl-chronology__reel')).not.toMatch(/height/);
});

it('lays the time rail out from the now line with a month-proportional length', () => {
  expect(rule('[data-now] > .sl-chronology__track')).toMatch(/left:\s*var\(--sl-now\)/);
  expect(rule('[data-now] > .sl-chronology__track')).toMatch(/var\(--sl-span\)/);
  expect(rule('.sl-chronology__event')).toMatch(/left:\s*calc\(var\(--sl-position-x\)/);
});

it('gives the loop/play video host a box so the text mask is measured with height', () => {
  expect(rule('.sl-video__media-host')).toMatch(/inset:\s*0/);
  expect(rule('.sl-photo__frame,\n.sl-video__frame')).toMatch(/margin:\s*0/);
});
