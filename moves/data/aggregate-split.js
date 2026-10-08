/** Grows one aggregate bar, then distributes its segments into chart bars. */
import { colorOf } from '../_shared/color.js';
import { gridLayout } from '../_shared/grid.js';
import { line, svgLayer, drawOn } from '../_shared/stroke.js';
import { px } from '../_shared/timeline.js';

const usable = (ctx, name) =>
  ctx.skipParts.includes(name)
    ? []
    : ctx.beat.part(name).filter((node) => !(ctx.skipNodes ?? []).includes(node));

export default {
  id: 'aggregate-split',
  family: 'data',
  role: 'enter',
  accepts: ['chart'],
  sources: ['aggregate-split-merge', 'stacked-grouped-transition'],
  reduce: 'fade',
  params: {
    duration: { type: 'number', default: 1.6, min: 0.8, max: 2.6, doc: '전체 길이(u)' },
    totalLabel: { type: 'boolean', default: true, doc: 'totalLabel(안무 설명의 같은 이름)' },
  },
  timing: (params) => ({ duration: params.duration, stops: [] }),
  build(tl, ctx, params) {
    const d = params.duration;
    const plot = ctx.beat.anchor('plot').rect;
    const marks = usable(ctx, 'mark');
    const values = (ctx.beat.data.series?.[0]?.values ?? marks.map((_, i) => i + 1)).map(Number);
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    const max = Math.max(total, ...values, 1);
    const aggregateH = (total / max) * plot.h;
    const barW = Math.min(72, plot.w / Math.max(3, values.length * 2));
    const left = plot.x + plot.w / 2 - barW / 2;
    const svg = svgLayer(ctx);
    const aggregate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    aggregate.setAttribute('x', String(left));
    aggregate.setAttribute('y', String(plot.y + plot.h - aggregateH));
    aggregate.setAttribute('width', String(barW));
    aggregate.setAttribute('height', String(aggregateH));
    aggregate.setAttribute('fill', colorOf(ctx, 'fg'));
    svg.append(aggregate);
    const cells = gridLayout({
      n: values.length,
      cols: Math.max(1, values.length),
      cell: values.length > 1 ? plot.w / (values.length - 1) : 0,
      origin: { x: plot.x, y: plot.y },
    });
    let cursor = plot.y + plot.h - aggregateH;
    const pieces = values.map((value, index) => {
      const height = (value / total) * aggregateH;
      const piece = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      piece.setAttribute('x', String(left));
      piece.setAttribute('y', String(cursor));
      piece.setAttribute('width', String(barW));
      piece.setAttribute('height', String(height));
      piece.setAttribute(
        'fill',
        index === values.length - 1 ? colorOf(ctx, 'accent') : colorOf(ctx, 'fg-muted'),
      );
      svg.append(piece);
      cursor += height;
      return { piece, height, x: cells[index].x - barW / 2, y: plot.y + plot.h - (value / max) * plot.h };
    });
    const boundaries = pieces
      .slice(0, -1)
      .map((item) =>
        line(
          svg,
          left,
          Number(item.piece.getAttribute('y')) + item.height,
          left + barW,
          Number(item.piece.getAttribute('y')) + item.height,
          { stroke: colorOf(ctx, 'bg'), 'stroke-width': 2 },
        ),
      );
    ctx.initial(aggregate, { scaleY: 0, transformOrigin: 'center bottom' });
    ctx.initial(
      pieces.map((item) => item.piece),
      { autoAlpha: 0 },
    );
    ctx.initial(boundaries, { autoAlpha: 0 });
    ctx.initial(marks, { autoAlpha: 0 });
    tl.to(aggregate, { scaleY: 1, duration: d * 0.3, ease: ctx.ease('out') }, 0);
    if (params.totalLabel) {
      const label = document.createElement('span');
      label.textContent = new Intl.NumberFormat('ko').format(total);
      Object.assign(label.style, {
        position: 'absolute',
        left: `${left}px`,
        top: `${plot.y + plot.h - aggregateH - 28}px`,
        color: colorOf(ctx, 'fg'),
      });
      ctx.overlay.append(label);
      ctx.initial(label, { autoAlpha: 0 });
      tl.to(label, { autoAlpha: 1, duration: d * 0.15, ease: ctx.ease('out') }, d * 0.15);
    }
    tl.to(
      pieces.map((item) => item.piece),
      { autoAlpha: 1, duration: 0.001 },
      d * 0.25,
    );
    boundaries.forEach((boundary) => {
      tl.to(boundary, { autoAlpha: 1, duration: 0.001 }, d * 0.25);
      drawOn(tl, boundary, { at: d * 0.25, duration: d * 0.25, ease: ctx.ease('out') });
    });
    pieces.forEach((item, index) =>
      tl.to(
        item.piece,
        {
          attr: { x: item.x, y: item.y, height: (values[index] / max) * plot.h },
          duration: d * 0.4,
          ease: ctx.ease('inout'),
        },
        d * 0.45,
      ),
    );
    tl.to(marks, { autoAlpha: 1, duration: d * 0.12, ease: ctx.ease('out') }, d * 0.78);
    tl.to(
      pieces.map((item) => item.piece),
      { autoAlpha: 0, duration: d * 0.12, ease: ctx.ease('in') },
      d * 0.78,
    );
    const text = ['title', 'dek', 'note'].flatMap((name) => usable(ctx, name));
    ctx.initial(text, { autoAlpha: 0, y: px(ctx, 12) });
    tl.to(text, { autoAlpha: 1, y: 0, duration: d * 0.25, ease: ctx.ease('out') }, d * 0.75);
    const highlight = ctx.beat.data.highlight;
    if (highlight) {
      const node = marks.find(
        (mark) =>
          mark.dataset.index === String(highlight.index) &&
          mark.dataset.series === String(highlight.series ?? 0),
      );
      if (node)
        tl.to(node, { fill: colorOf(ctx, 'accent'), duration: d * 0.15, ease: ctx.ease('out') }, d * 0.85);
    }
  },
};
