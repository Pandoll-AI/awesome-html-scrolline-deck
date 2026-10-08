import { describe, expect, it } from 'vitest';
import beat from './video.js';
describe('video beat', () => {
  it('renders a playable video media part', () => {
    const view = beat.render(
      { src: 'assets/a.mp4', poster: 'assets/a.webp', alt: '시연', mode: 'loop', caption: '데모' },
      { asset: (p) => `/d/${p}` },
    );
    expect(beat.fields.src.required).toBe(true);
    expect(view.parts.frame).toHaveLength(1);
    expect(view.parts.media[0].tagName).toBe('VIDEO');
    expect(view.parts.media[0].loop).toBe(true);
    expect(view.parts.caption[0].textContent).toBe('데모');
  });
  it('requires poster and mode', () => {
    expect(beat.fields.poster.required).toBe(true);
    expect(beat.fields.mode.required).toBe(true);
  });
});
