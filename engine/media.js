/**
 * @stub W2-E6 구현 대상. 구현 시 이 줄 삭제 + media.test.js 작성
 * 프레임 시퀀스·재생 영상·text mask(CONTRACTS C13). 규칙 수치 = constants.FRAMES.
 */

/**
 * tier 선택: viewport.w * dpr >= 1400 이면 가장 큰 tier, 아니면 960(없으면 가장 작은 것).
 * @param {import('./types.js').FramesManifest} manifest
 * @param {{ w: number, dpr: number }} viewport
 * @returns {number}
 */
export function pickTier(manifest, viewport) {
  throw new Error('TODO(E6): pickTier');
}

/**
 * 로딩 순서(0-base 프레임 index): coarse(8장 간격) → current ±12 → 나머지. 중복 없음. poster는 별도.
 * @param {number} count
 * @param {number} current
 * @returns {number[]}
 */
export function loadOrder(count, current) {
  throw new Error('TODO(E6): loadOrder');
}

/**
 * @param {HTMLElement} host
 * @param {import('./types.js').FramesManifest | string} manifest
 * @param {{ fit?: 'cover'|'contain', tier?: number, viewport?: import('./types.js').Viewport }} [opts]
 * @returns {import('./types.js').FrameSeq}
 */
export function frameSequence(host, manifest, opts) {
  throw new Error('TODO(E6): frameSequence');
}

/**
 * @param {HTMLElement} host
 * @param {{ src: string, poster?: string, loop?: boolean, mode: 'play'|'loop' }} spec
 * @param {{ exportMode: boolean }} opts
 * @returns {import('./types.js').Clip}
 */
export function videoClip(host, spec, opts) {
  throw new Error('TODO(E6): videoClip');
}

/**
 * 글자 모양 SVG mask → data:image/svg+xml URL
 * @param {string} text
 * @param {{ font: string, width: number, height: number, align?: 'center'|'left' }} opts
 * @returns {string}
 */
export function textMask(text, opts) {
  throw new Error('TODO(E6): textMask');
}

/**
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export function preloadImages(urls) {
  throw new Error('TODO(E6): preloadImages');
}
