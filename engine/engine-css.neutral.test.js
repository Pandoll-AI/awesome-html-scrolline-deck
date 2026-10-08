import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// #49: engine.css는 모든 컨셉 공통 중립 기본값만. 컨셉 고유 배치는 concepts/<id>/layout.css(C11).
const css = readFileSync('engine/engine.css', 'utf8');
const rule = (selector) => {
  const at = css.indexOf(`${selector} {`);
  return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
};

it('keeps concept grammar out of the engine (no concept scope, tone or now-line layout)', () => {
  expect(css).not.toMatch(/\.sl-concept-/);
  expect(css).not.toMatch(/\[data-tone/);
  expect(css).not.toMatch(/\[data-now\]/);
});

it('lets the counter reel stack ten digits instead of stretching to one line', () => {
  expect(rule('.sl-chronology__counter')).toMatch(/align-items:\s*flex-start/);
  expect(rule('.sl-chronology__counter')).toMatch(/overflow:\s*hidden/);
  expect(rule('.sl-chronology__reel')).not.toMatch(/height/);
});

it('places chronology events on the track by their date ratio', () => {
  expect(rule('.sl-chronology__track')).toMatch(/position:\s*absolute/);
  expect(rule('.sl-chronology__event')).toMatch(/left:\s*calc\(var\(--sl-position-x\)/);
});

it('gives the loop/play video host a box so the text mask is measured with height', () => {
  expect(rule('.sl-video__media-host')).toMatch(/inset:\s*0/);
  expect(rule('.sl-photo__frame,\n.sl-video__frame')).toMatch(/margin:\s*0/);
});
