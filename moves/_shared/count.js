/** Deterministic numeric text tweening. */
export function formatNumber(v, { lang = 'ko', decimals = 0, prefix = '', suffix = '' } = {}) {
  return `${prefix}${new Intl.NumberFormat(lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)}${suffix}`;
}
export function countTo(tl, node, { from, to, at, duration, ease, lang, decimals, prefix, suffix }) {
  node.textContent = formatNumber(from, { lang, decimals, prefix, suffix });
  const proxy = { v: from };
  tl.fromTo(
    proxy,
    { v: from },
    {
      v: to,
      duration,
      ease,
      immediateRender: false,
      onUpdate: () => {
        node.textContent = formatNumber(proxy.v, { lang, decimals, prefix, suffix });
      },
    },
    at,
  );
  tl.set(node, { textContent: formatNumber(to, { lang, decimals, prefix, suffix }) }, at + duration);
}
