import { boot } from '../../engine/index.js';
import '../../engine/engine.css';
import moves from '../../moves/index.js';
import concept from '../../concepts/_smoke/index.js';
import '../../concepts/_smoke/tokens.css';
import deck from './deck.yaml';

boot({ host: document.getElementById('app'), deck, concept, moves, assetBase: import.meta.env.BASE_URL });
