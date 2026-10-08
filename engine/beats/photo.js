/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + photo.test.js 작성
 * beat 'photo'(CONTRACTS C4). parts: frame, media, caption. primary: frame.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--photo" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'photo',
  primary: 'frame',
  fields: {
    src: {
      type: 'asset',
      required: true,
      doc: '이미지 경로(assets/…)'
    },
    alt: {
      type: 'string',
      required: true,
      doc: '대체 텍스트'
    },
    focus: {
      type: 'object',
      fields: {
        x: {
          type: 'number',
          min: 0,
          max: 1,
          default: 0.5,
          doc: '초점 x'
        },
        y: {
          type: 'number',
          min: 0,
          max: 1,
          default: 0.5,
          doc: '초점 y'
        }
      },
      doc: '초점(0..1), background-position·transform-origin'
    },
    caption: {
      type: 'string',
      doc: '캡션'
    },
    credit: {
      type: 'string',
      doc: '저작자 표기'
    },
    source: {
      type: 'string',
      doc: '출처 id(deck.sources[].id). sample 덱이 아니면 수치·인용·실사에 필수'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render photo');
  },
};
