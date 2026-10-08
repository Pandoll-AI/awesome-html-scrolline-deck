import { boot } from '../../engine/index.js';
import '../../engine/engine.css';
import moves from '../../moves/index.js';
import concept from '../../concepts/rail/index.js';
import '../../concepts/rail/tokens.css';
import deck from './deck.yaml';

boot({ host: document.getElementById('app'), deck, concept, moves, assetBase: import.meta.env.BASE_URL });
