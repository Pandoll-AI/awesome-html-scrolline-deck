/**
 * move family 'type'(CONTRACTS C5·C16). 메인 소유: W3 잡이 move를 병합할 때 메인이 import 한 줄 + 배열 항목 하나를 추가한다.
 * 규칙: default export = MoveDef 배열, id 알파벳 순, 이 폴더 밖 import 금지(./<id>.js만). 목록 정본 = plan/MOVES.md §3.
 */
import glyphRise from './glyph-rise.js';
import lineMaskRise from './line-mask-rise.js';
import mapLabelSettle from './map-label-settle.js';
import pushBuild from './push-build.js';
import trackingClose from './tracking-close.js';
import wordSlam from './word-slam.js';

export default [glyphRise, lineMaskRise, mapLabelSettle, pushBuild, trackingClose, wordSlam];
