/**
 * beat 'chronology'(CONTRACTS C4). parts: track, event, date, title, note, media. primary: track.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--chronology" data-beat="<id>">는 build가 id를 채운다.
 */

import { add, asset, node, root } from './helpers.js';

function timestamp(date, fallback) {
  const value = Date.parse(date);
  return Number.isFinite(value) ? value : fallback;
}

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
            doc: 'ISO 날짜 또는 연도',
          },
          title: {
            type: 'string',
            required: true,
            doc: '제목',
          },
          note: {
            type: 'string',
            doc: '한 줄 설명',
          },
          media: {
            type: 'asset',
            doc: '이미지',
          },
        },
      },
    },
    scale: {
      type: 'enum',
      values: ['even', 'time'],
      default: 'even',
      doc: 'even = 같은 간격, time = 날짜 비례',
    },
    axis: {
      type: 'enum',
      values: ['x', 'y'],
      default: 'x',
      doc: '레일 방향',
    },
  },
  render(data, rc) {
    const parts = {};
    const view = root('chronology', rc);
    const axis = data.axis ?? 'x';
    const track = add(parts, 'track', node(rc, 'div', `sl-chronology sl-chronology--${axis}`, view));
    const dates = data.events.map((event, index) => timestamp(event.date, index));
    const lo = Math.min(...dates);
    const hi = Math.max(...dates);
    data.events.forEach((event, index) => {
      const ratio =
        data.scale === 'time' && hi !== lo
          ? (dates[index] - lo) / (hi - lo)
          : index / Math.max(1, data.events.length - 1);
      const item = add(parts, 'event', node(rc, 'article', 'sl-chronology__event', track));
      item.style.setProperty(axis === 'x' ? '--sl-position-x' : '--sl-position-y', `${ratio * 100}%`);
      item.dataset.position = String(ratio);
      add(parts, 'date', node(rc, 'time', 'sl-chronology__date', item, event.date));
      add(parts, 'title', node(rc, 'h3', 'sl-chronology__title', item, event.title));
      if (event.note) add(parts, 'note', node(rc, 'p', 'sl-chronology__note', item, event.note));
      if (event.media) {
        const img = add(parts, 'media', node(rc, 'img', 'sl-chronology__media', item));
        img.src = asset(rc, event.media);
        img.alt = event.title;
      }
    });
    return { root: view, parts };
  },
};
