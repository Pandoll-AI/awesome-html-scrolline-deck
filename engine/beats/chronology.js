/**
 * @stub W2-E5 구현 대상. 구현 시 이 줄 삭제 + chronology.test.js 작성
 * beat 'chronology'(CONTRACTS C4). parts: track, event, date, title, note, media. primary: track.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--chronology" data-beat="<id>">는 build가 id를 채운다.
 */

/** @type {import('../types.js').BeatTypeDef} */
export default {
  type: 'chronology',
  primary: 'track',
  fields: {
    events: {
      type: 'array',
      required: true,
      doc: '사건(2개 이상)',
      of: {
        type: 'object',
        doc: '사건',
        fields: {
          date: {
            type: 'string',
            required: true,
            doc: 'ISO 날짜 또는 연도'
          },
          title: {
            type: 'string',
            required: true,
            doc: '제목'
          },
          note: {
            type: 'string',
            doc: '한 줄 설명'
          },
          media: {
            type: 'asset',
            doc: '이미지'
          }
        }
      }
    },
    scale: {
      type: 'enum',
      values: [
        'even',
        'time'
      ],
      default: 'even',
      doc: 'even = 같은 간격, time = 날짜 비례'
    },
    axis: {
      type: 'enum',
      values: [
        'x',
        'y'
      ],
      default: 'x',
      doc: '레일 방향'
    }
  },
  render(data, rc) {
    throw new Error('TODO(E5): render chronology');
  },
};
