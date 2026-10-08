/**
 * beat 'text'(CONTRACTS C4). parts: block, line, word, em. primary: block.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--text" data-beat="<id>">는 build가 id를 채운다.
 */

import { add, root, node, textWords } from './helpers.js';

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'text',
  primary: 'block',
  fields: {
    text: {
      type: 'string',
      required: true,
      doc: '한 문장. 어절 단위로 쪼갠다',
    },
    emphasis: {
      type: 'array',
      of: {
        type: 'string',
        doc: '강조할 부분 문자열',
      },
      doc: '강조 부분 문자열 목록(part em)',
    },
    size: {
      type: 'enum',
      values: ['xl', 'l', 'm'],
      default: 'l',
      doc: '글자 크기 단계',
    },
    lines: {
      type: 'array',
      of: {
        type: 'string',
        doc: '한 줄',
      },
      doc: '명시 줄 나눔(있으면 text 대신 사용, 합치면 text와 같아야 함)',
    },
  },
  render(data, rc) {
    const parts = {};
    const view = root('text', rc);
    const block = add(parts, 'block', node(rc, 'div', `sl-text sl-text--${data.size ?? 'l'}`, view));
    const lines = data.lines?.length ? data.lines : String(data.text).split('\n');
    lines.forEach((line) => {
      const lineEl = add(parts, 'line', node(rc, 'div', 'sl-text__line', block));
      const renderedWords = textWords(rc, lineEl, line, parts);
      for (const word of renderedWords)
        if ((data.emphasis ?? []).some((phrase) => phrase && word.textContent.includes(phrase))) {
          const em = add(parts, 'em', node(rc, 'mark', 'sl-text__em', null, word.textContent));
          word.replaceChildren(em);
        }
    });
    return { root: view, parts };
  },
};
