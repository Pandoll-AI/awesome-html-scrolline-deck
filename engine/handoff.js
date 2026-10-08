/**
 * @stub W2-E4 구현 대상. 구현 시 이 줄 삭제 + handoff.test.js 작성
 * 측정 스냅샷·anchor·좌표 변환(CONTRACTS C7).
 */

/**
 * node의 root 기준 layout rect(getBoundingClientRect 차이). transform은 측정 전에 없어야 한다.
 * @param {Element} node
 * @param {Element} root
 * @returns {import('./types.js').Rect}
 */
export function defaultMeasure(node, root) {
  throw new Error('TODO(E4): defaultMeasure');
}

/** rectIn = defaultMeasure 별칭(J조 dom.js 이름 계승) */
export function rectIn(node, root) {
  return defaultMeasure(node, root);
}

/**
 * 모든 beat의 모든 part 요소 rect 스냅샷. build ②에서 1회.
 * @param {Element} root
 * @param {Array<{ root: Element, parts: Record<string, Element[]> }>} beats
 * @param {(node: Element, root: Element) => import('./types.js').Rect} [measureFn]
 * @returns {import('./types.js').MeasureSnapshot}
 */
export function measure(root, beats, measureFn = defaultMeasure) {
  throw new Error('TODO(E4): measure');
}

/**
 * @param {{ id: string, parts: Record<string, Element[]> }} beat
 * @param {string} part  비면 primary
 * @param {import('./types.js').MeasureSnapshot} snapshot
 * @param {string} [primary]
 * @returns {import('./types.js').Handoff}
 */
export function anchorOf(beat, part, snapshot, primary) {
  throw new Error('TODO(E4): anchorOf');
}

/**
 * clip-path inset 문자열: `inset(${y}px ${W-x-w}px ${H-y-h}px ${x}px)`
 * @param {import('./types.js').Rect} rect
 * @param {{ w: number, h: number }} viewport
 * @returns {string}
 */
export function toInset(rect, viewport) {
  throw new Error('TODO(E4): toInset');
}

/**
 * from 요소를 to 자리로 보내는 GSAP vars: { x, y, scaleX, scaleY, transformOrigin: '0 0' }
 * @param {import('./types.js').Rect} fromRect
 * @param {import('./types.js').Rect} toRect
 * @returns {{ x: number, y: number, scaleX: number, scaleY: number, transformOrigin: string }}
 */
export function transferVars(fromRect, toRect) {
  throw new Error('TODO(E4): transferVars');
}
