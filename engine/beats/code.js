/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + code.test.js 작성
 * beat 'code'(CONTRACTS C4). parts: block, line, token, caret. primary: block.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--code" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'code',
  primary: 'block',
  fields: {
    code: {
      type: 'string',
      required: true,
      doc: '코드 원문'
    },
    lang: {
      type: 'string',
      required: true,
      doc: '언어 이름'
    },
    highlight: {
      type: 'array',
      doc: '강조 줄 범위',
      of: {
        type: 'array',
        of: {
          type: 'integer',
          min: 1,
          doc: '줄 번호(1-base)'
        },
        doc: '[from, to]'
      }
    },
    caption: {
      type: 'string',
      doc: '캡션'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render code');
  },
};
