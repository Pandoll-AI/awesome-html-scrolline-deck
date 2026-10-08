/** Timeline arithmetic shared by W3 moves. */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (d, a, b) => ({ at: d * a, duration: d * b - d * a });
export const px = (ctx, n) => n * ctx.viewport.px;
export function slots(n, { start = 0, span, each, compress = 1, minRatio = 0.4 }) {
  if (!n) return [];
  const base = each ?? (n > 1 ? span / (n - 1) : (span ?? 0));
  const ratios = Array.apply(null, { length: Math.max(0, n - 1) }).map((_, i) =>
    Math.max(minRatio, compress ** i),
  );
  const total = ratios.reduce((sum, ratio) => sum + ratio, 0) || 1;
  const scale = each === undefined && span !== undefined ? span / total : base;
  let at = start;
  return Array.apply(null, { length: n }).map((_, i) => {
    const value = { at, duration: base };
    at += (ratios[i] ?? 0) * scale;
    return value;
  });
}
