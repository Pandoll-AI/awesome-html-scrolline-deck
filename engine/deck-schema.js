/** Deck shape validation and C3 content audit. */
import { BEAT_TYPES, ID_PATTERN, PLACEHOLDER_PATTERNS, ROLES } from './constants.js';
import { validateSchema } from './util/schema.js';

const issue = (errors, path, message) => errors.push({ path, message });
function walkStrings(value, path, errors) {
  if (typeof value === 'string') {
    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value)))
      issue(errors, path, 'placeholder text is not allowed');
  } else if (Array.isArray(value))
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, errors));
  else if (value && typeof value === 'object')
    Object.entries(value).forEach(([key, item]) => walkStrings(item, `${path}.${key}`, errors));
}
function defaultMove(beat, role, concept) {
  if (beat[role]) return beat[role];
  const move = concept.defaults?.byType?.[beat.type]?.[role] ?? concept.defaults?.[role];
  return move
    ? { move }
    : role === 'enter'
      ? { move: 'engine:fade-in' }
      : role === 'exit'
        ? { move: 'engine:fade-out' }
        : null;
}
function requiresSource(beat) {
  return beat.type === 'number' || beat.type === 'quote' || beat.type === 'photo' || beat.type === 'chart';
}

/** @param {import('./types.js').DeckSpec} deck */
export function validateDeck(deck, env) {
  const errors = [];
  if (!deck || typeof deck !== 'object')
    return { ok: false, errors: [{ path: 'deck', message: 'must be an object' }] };
  walkStrings(deck, 'deck', errors);
  if (typeof deck.id !== 'string' || !ID_PATTERN.test(deck.id)) issue(errors, 'deck.id', 'invalid id');
  if (!['ko', 'en'].includes(deck.lang)) issue(errors, 'deck.lang', 'must be ko or en');
  if (deck.concept !== env.concept.id) issue(errors, 'deck.concept', 'does not match concept');
  if (!Array.isArray(deck.beats) || !deck.beats.length)
    issue(errors, 'deck.beats', 'must contain at least one beat');
  const sourceIds = new Set();
  for (const [index, source] of (deck.sources ?? []).entries()) {
    if (!source?.id || sourceIds.has(source.id)) issue(errors, `deck.sources[${index}].id`, 'must be unique');
    sourceIds.add(source?.id);
  }
  const ids = new Set();
  const usage = new Map();
  for (const [i, beat] of (deck.beats ?? []).entries()) {
    const path = `deck.beats[${i}]`;
    if (!beat || typeof beat !== 'object') {
      issue(errors, path, 'must be an object');
      continue;
    }
    if (typeof beat.id !== 'string' || !ID_PATTERN.test(beat.id) || ids.has(beat.id))
      issue(errors, `${path}.id`, 'must be a unique valid id');
    ids.add(beat.id);
    if (!BEAT_TYPES.includes(beat.type) || !env.concept.beats?.allow?.includes(beat.type))
      issue(errors, `${path}.type`, 'beat type is not allowed by concept');
    const type = beat.type === 'sequence' ? env.sequences?.[beat.use] : env.beatTypes?.[beat.type];
    if (!type) issue(errors, `${path}.type`, 'unknown beat type');
    else {
      const fields = Object.fromEntries(
        Object.keys(type.fields)
          .filter((key) => Object.hasOwn(beat, key))
          .map((key) => [key, beat[key]]),
      );
      errors.push(...validateSchema(type.fields, fields, path));
    }
    if (beat.link && i === deck.beats.length - 1) issue(errors, `${path}.link`, 'last beat cannot have link');
    if (!deck.sample && requiresSource(beat)) {
      if (!beat.source) issue(errors, `${path}.source`, 'source is required');
      else if (!sourceIds.has(beat.source)) issue(errors, `${path}.source`, 'source is not in deck.sources');
    }
    const refs = [];
    for (const role of ['enter', 'exit', 'link', 'camera']) {
      const ref = defaultMove(beat, role, env.concept);
      if (ref) refs.push([role, ref]);
    }
    for (const step of beat.steps ?? []) refs.push(['step', step]);
    for (const ambient of beat.ambient ?? []) refs.push(['ambient', ambient]);
    for (const [role, ref] of refs) {
      if (!ref || typeof ref.move !== 'string') {
        issue(errors, `${path}.${role}`, 'move reference is invalid');
        continue;
      }
      if (!env.registry.has(ref.move)) {
        issue(errors, `${path}.${role}.move`, 'unknown move');
        continue;
      }
      const move = env.registry.get(ref.move);
      if (move.role !== role) issue(errors, `${path}.${role}.move`, `must have ${role} role`);
      if (!move.accepts.includes('*') && !move.accepts.includes(beat.type))
        issue(errors, `${path}.${role}.move`, 'does not accept beat type');
      if (!env.concept.moves?.allow?.includes(ref.move) && !ref.move.startsWith('engine:') && !ref.override)
        issue(errors, `${path}.${role}.override`, 'required for move outside concept allow list');
      const key = `${role}:${ref.move}`;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }
  for (const [key, count] of usage)
    if (count > 1) {
      const [role, move] = key.split(':');
      const allowed = (deck.beats ?? []).some(
        (beat) =>
          beat.repeat === 'intended' &&
          [
            beat[role],
            ...(role === 'step' ? (beat.steps ?? []) : role === 'ambient' ? (beat.ambient ?? []) : []),
          ].some((ref) => ref?.move === move),
      );
      if (!allowed) issue(errors, `deck.beats`, `${move} repeats as ${role} without repeat: intended`);
    }
  return { ok: errors.length === 0, errors };
}
