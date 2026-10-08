/** Link finishing and transform-safe overlay ghosts. */
export function finishLink(
  tl,
  ctx,
  { at, cross = 0.12, from = [ctx.handoff.from.node], to = [ctx.handoff.to.node] },
) {
  const duration = Math.min(0.15, Math.max(0, cross));
  ctx.initial(to, { autoAlpha: 0 });
  tl.to(from, { autoAlpha: 0, duration }, at - duration);
  tl.to(to, { autoAlpha: 1, duration }, at - duration);
  tl.set(to, { autoAlpha: 1 }, at);
  tl.set(from, { autoAlpha: 0 }, at);
}
export function ghost(ctx, node, rect) {
  const copy = node.cloneNode(true);
  copy.removeAttribute('data-part');
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    margin: '0',
  });
  copy.dataset.slRect = JSON.stringify(rect);
  ctx.overlay.append(copy);
  return copy;
}
export function carriedRect(node, gsap) {
  const rect = JSON.parse(node.dataset.slRect ?? '{}');
  const get = (name, fallback) => Number(gsap.getProperty(node, name)) || fallback;
  const sx = get('scaleX', 1),
    sy = get('scaleY', 1);
  return { x: rect.x + get('x', 0), y: rect.y + get('y', 0), w: rect.w * sx, h: rect.h * sy };
}
