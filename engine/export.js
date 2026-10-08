/**
 * @stub W2-E7 구현 대상. 구현 시 이 줄 삭제 + export.test.js 작성
 * 덱 → MP4 발표 경로(CONTRACTS C14). 기본값 = constants.EXPORT_DEFAULTS.
 */

/**
 * 순수. lead → (travel → hold)* → travel → tail.
 * @param {import('./types.js').TimelineMap} map
 * @param {Partial<import('./types.js').ExportOptions>} [opts]
 * @param {Record<string, number>} [holds]  stop 이름 → hold 초(beat.exportHold)
 * @returns {import('./types.js').ExportPath}
 */
export function exportPath(map, opts, holds) {
  throw new Error('TODO(E7): exportPath');
}

/**
 * paused wrapper: segment마다 master.tweenFromTo(from, to, { duration, ease })를 start 초에 add.
 * @param {object} master  paused master timeline
 * @param {import('./types.js').ExportPath} path
 * @param {object} gsap
 * @returns {object}
 */
export function buildExportTimeline(master, path, gsap) {
  throw new Error('TODO(E7): buildExportTimeline');
}

/**
 * timeline 시각 u → 영상 초. 단조 비감소. 한 u가 hold 구간이면 그 hold 시작 초.
 * @param {import('./types.js').ExportPath} path
 * @param {number} t
 * @returns {number}
 */
export function toExportSeconds(path, t) {
  throw new Error('TODO(E7): toExportSeconds');
}
