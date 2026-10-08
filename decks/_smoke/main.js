/**
 * @stub W2-E8 구현 대상. CONTRACTS C15 덱 진입 형태. 컨셉은 E8이 최소 팩을 덱 안이 아니라 concepts/_smoke/에 둔다.
 */
import { boot } from '../../engine/index.js';
import '../../engine/engine.css';
import moves from '../../moves/index.js';
import deck from './deck.yaml';

boot({ host: document.getElementById('app'), deck, concept: null, moves, assetBase: import.meta.env.BASE_URL });
