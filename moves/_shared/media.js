/** Frame-sequence access and seek-safe scrubbing. */
export function frameSeqOf(beat) {
  return beat?.media?.seq ?? beat?.part?.('media')?.[0]?.slSeq ?? null;
}
export function scrubTo(tl, seq, { from, to, at, duration, ease = 'none' }) {
  const proxy = { p: from };
  tl.fromTo(
    proxy,
    { p: from },
    { p: to, duration, ease, immediateRender: false, onUpdate: () => seq?.setProgress(proxy.p) },
    at,
  );
}
