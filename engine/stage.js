/**
 * @stub W2-E1 구현 대상. 구현 시 이 줄 삭제 + stage.test.js 작성
 * 무대·카메라·slot·world(CONTRACTS C2, C8).
 * DOM 구조: .sl-stage > .sl-viewport > .sl-camera > .sl-world, 형제로 .sl-screen, 최상단 .sl-overlay
 */

/**
 * C2 뷰포트 식. portrait = w/h <= 1, px = portrait ? w/760 : min(w, h*16/9)/1920, dpr = min(dpr, 2)
 * @param {number} w
 * @param {number} h
 * @param {number} [dpr]
 * @returns {import('./types.js').Viewport}
 */
export function computeViewport(w, h, dpr = 1) {
  throw new Error('TODO(E1): computeViewport');
}

/**
 * 무대를 host 안에 만든다. stage 루트에 --px, --vw-px, --vh-px, --sl-portrait와 class sl-concept-<id> 설정.
 * mode 'export'면 1920×1080 고정 크기.
 * @param {HTMLElement} host
 * @param {{ viewport: import('./types.js').Viewport, concept: import('./types.js').ConceptPack, mode?: 'live'|'export' }} opts
 * @returns {import('./types.js').Stage}
 */
export function createStage(host, opts) {
  throw new Error('TODO(E1): createStage');
}
