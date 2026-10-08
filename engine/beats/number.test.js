import { describe, expect, it } from 'vitest';
import beat from './number.js';
describe('number beat', () => {
  it('formats numbers with Intl and exposes all present parts', () => {
    const view = beat.render(
      { value: 1234.5, label: '사용자', format: { prefix: '$', decimals: 1, unit: '명' }, source: 's1' },
      { lang: 'en-US' },
    );
    expect(beat.fields.value.required).toBe(true);
    expect(view.parts.digits[0].textContent).toBe('1,234.5');
    expect(view.parts.value).toHaveLength(1);
    expect(view.parts.unit[0].textContent).toBe('명');
    expect(view.parts.label[0].textContent).toBe('사용자');
    expect(view.parts.source[0].textContent).toBe('s1');
  });
  it('declares label required', () => expect(beat.fields.label.required).toBe(true));
});
