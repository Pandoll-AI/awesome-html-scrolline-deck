/**
 * @stub W2-E1 구현 대상. 구현 시 이 줄 삭제 + a11y.test.js 작성
 * 접근성(ARCHITECTURE §3, CONTRACTS C12).
 * - reduced-motion: ?motion=reduce 가 matchMedia보다 우선
 * - aria-live polite 영역: scrolline:stop 때 그 beat의 텍스트를 읽어 줌
 * - transcript: 화면 밖(.sl-sr-only) <ol>에 beat 텍스트를 순서대로
 * - inert: scrolline:active leave인 beat 루트에 inert, enter면 해제
 */

/**
 * @param {{ search?: string, matchMedia?: (q: string) => { matches: boolean } }} [env]  테스트 주입용
 * @returns {boolean}
 */
export function prefersReducedMotion(env) {
  throw new Error('TODO(E1): prefersReducedMotion');
}

/**
 * @param {{ stage: import('./types.js').Stage, beats: import('./types.js').BeatInstance[], target?: EventTarget }} opts
 * @returns {{ announce: (text: string) => void, destroy: () => void }}
 */
export function createA11y(opts) {
  throw new Error('TODO(E1): createA11y');
}
