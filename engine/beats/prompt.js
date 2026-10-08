/**
 * beat 'prompt'(CONTRACTS C4). parts: field, char, caret, label, result. primary: field.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--prompt" data-beat="<id>">는 build가 id를 채운다.
 */

import { add, asset, node, root, textChars } from './helpers.js';
/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'prompt',
  primary: 'field',
  fields: {
    text: {
      type: 'string',
      required: true,
      doc: '프롬프트 원문(글자 단위 타이핑)',
    },
    label: {
      type: 'string',
      doc: '입력창 위 라벨',
    },
    result: {
      type: 'object',
      doc: '결과',
      fields: {
        type: {
          type: 'enum',
          values: ['photo', 'text'],
          required: true,
          doc: '결과 종류',
        },
        src: {
          type: 'asset',
          doc: '이미지',
        },
        text: {
          type: 'string',
          doc: '답 텍스트',
        },
        alt: {
          type: 'string',
          doc: '대체 텍스트',
        },
      },
    },
  },
  render(data, rc) {
    const parts = {};
    const view = root('prompt', rc);
    if (data.label) add(parts, 'label', node(rc, 'label', 'sl-prompt__label', view, data.label));
    const field = add(parts, 'field', node(rc, 'div', 'sl-prompt__field', view));
    textChars(rc, field, data.text, parts);
    add(parts, 'caret', node(rc, 'span', 'sl-prompt__caret', field, '▍'));
    if (data.result) {
      const result = add(parts, 'result', node(rc, 'div', 'sl-prompt__result', view));
      if (data.result.type === 'photo' && data.result.src) {
        const img = node(rc, 'img', null, result);
        img.src = asset(rc, data.result.src);
        img.alt = data.result.alt ?? '';
      }
      if (data.result.type === 'text' && data.result.text) result.textContent = data.result.text;
    }
    return { root: view, parts };
  },
};
