/**
 * beat 'chronology'(CONTRACTS C4). primary: track.
 * 렌더 = 정지점 완성 상태 DOM. 움직임 0. 루트 <section class="sl-beat sl-beat--chronology" data-beat="<id>">는 build가 id를 채운다.
 */

import { add, asset, node, root } from './helpers.js';

function timestamp(date, fallback) {
  const value = Date.parse(date);
  return Number.isFinite(value) ? value : fallback;
}

function dateDigits(date, counter) {
  const digits = String(date).match(/\d/g)?.join('') ?? '';
  const wanted = counter === 'year' ? 4 : 6;
  return digits.slice(0, wanted).padEnd(wanted, '0');
}

function sourceLabel(rc, source) {
  const ids = Array.isArray(source) ? source : [source];
  return ids
    .filter(Boolean)
    .map((id) => rc.sources?.[id]?.short ?? rc.sources?.[id]?.title ?? id)
    .join(' · ');
}

function yearOf(date) {
  const match = String(date).match(/^(-?\d{4})/);
  return match ? Number(match[1]) : null;
}

function tickYears(events, scale) {
  if (scale !== 'time') return events.map((event) => yearOf(event.date) ?? event.date);
  const years = events.map((event) => yearOf(event.date)).filter(Number.isFinite);
  if (!years.length) return [];
  const first = Math.min(...years);
  const last = Math.max(...years);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
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
          weight: {
            type: 'enum',
            values: ['major', 'minor'],
            default: 'major',
            doc: '사건 비중',
          },
          source: {
            type: 'any',
            doc: '날짜 출처 id',
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
    label: {
      type: 'string',
      doc: '장 제목',
    },
    caption: {
      type: 'string',
      doc: '트랙 끝 보충 문구',
    },
    counter: {
      type: 'enum',
      values: ['none', 'year', 'month'],
      default: 'none',
      doc: '날짜 숫자 릴',
    },
    ground: {
      type: 'boolean',
      default: false,
      doc: '배경 연도층',
    },
    now: {
      type: 'number',
      doc: '현재 위치(0..1)',
    },
    ticks: {
      type: 'enum',
      values: ['none', 'year'],
      default: 'none',
      doc: '연도 눈금',
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
    if (data.ground) {
      const ground = add(parts, 'ground', node(rc, 'div', 'sl-chronology__ground', track));
      ground.dataset.depth = '0';
      data.events.forEach((event) => {
        add(parts, 'ghost', node(rc, 'span', 'sl-chronology__ghost', ground, String(event.date).slice(0, 4)));
      });
    }
    data.events.forEach((event, index) => {
      const ratio =
        data.scale === 'time' && hi !== lo
          ? (dates[index] - lo) / (hi - lo)
          : index / Math.max(1, data.events.length - 1);
      const item = add(parts, 'event', node(rc, 'article', 'sl-chronology__event', track));
      item.style.setProperty(axis === 'x' ? '--sl-position-x' : '--sl-position-y', `${ratio * 100}%`);
      item.dataset.position = String(ratio);
      item.dataset.weight = event.weight ?? 'major';
      add(parts, 'dot', node(rc, 'span', 'sl-chronology__dot', item));
      add(parts, 'stem', node(rc, 'span', 'sl-chronology__stem', item));
      add(parts, 'date', node(rc, 'time', 'sl-chronology__date', item, event.date));
      add(parts, 'title', node(rc, 'h3', 'sl-chronology__title', item, event.title));
      if (event.note) add(parts, 'note', node(rc, 'p', 'sl-chronology__note', item, event.note));
      if (event.media) {
        const img = add(parts, 'media', node(rc, 'img', 'sl-chronology__media', item));
        img.src = asset(rc, event.media);
        img.alt = event.title;
      }
      if (event.source) {
        add(parts, 'source', node(rc, 'small', 'sl-chronology__source', item, sourceLabel(rc, event.source)));
      }
    });
    if (data.label) add(parts, 'label', node(rc, 'h2', 'sl-chronology__label', view, data.label));
    if (data.caption) add(parts, 'caption', node(rc, 'p', 'sl-chronology__caption', view, data.caption));
    if (data.counter && data.counter !== 'none') {
      const counter = add(parts, 'counter', node(rc, 'div', 'sl-chronology__counter', view));
      Array.from(dateDigits(data.events[0].date, data.counter)).forEach((digit, place) => {
        const reel = add(parts, 'reel', node(rc, 'span', 'sl-chronology__reel', counter));
        reel.dataset.place = String(place);
        reel.dataset.digit = digit;
        reel.style.transform = `translateY(-${Number(digit) * 10}%)`;
        Array.from({ length: 10 }, (_, value) =>
          node(rc, 'span', 'sl-chronology__reel-digit', reel, String(value)),
        );
      });
    }
    if (typeof data.now === 'number') {
      const now = add(parts, 'now', node(rc, 'div', 'sl-chronology__now', view));
      now.style.left = `${data.now * 100}%`;
    }
    if (data.ticks === 'year') {
      const years = tickYears(data.events, data.scale ?? 'even');
      const first = years[0];
      const last = years.at(-1);
      years.forEach((year, index) => {
        const tick = add(parts, 'tick', node(rc, 'span', 'sl-chronology__tick', track, String(year)));
        const ratio =
          data.scale === 'time' && first !== last
            ? index / (years.length - 1)
            : index / Math.max(1, years.length - 1);
        tick.style.setProperty(axis === 'x' ? '--sl-position-x' : '--sl-position-y', `${ratio * 100}%`);
        tick.dataset.year = String(year);
      });
    }
    return { root: view, parts };
  },
};
