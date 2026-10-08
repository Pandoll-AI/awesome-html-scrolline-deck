import path from 'node:path';

export const DECK_ID = /^_?[a-z0-9][a-z0-9-]*$/;

const option = (args, name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

export function parseExportArgs(args) {
  if (args.includes('--help') || !args.length) return { help: true };
  const deckId = args[0];
  if (!DECK_ID.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const fps = Number(option(args, '--fps', '30'));
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('--fps must be a positive integer');
  return {
    deckId,
    fps,
    out: option(args, '--out', `out/export/${deckId}.mp4`),
    report: option(args, '--report', null),
    dryRun: args.includes('--dry-run'),
    buildOnly: args.includes('--build-only'),
  };
}

export function exportPaths(root, deckId, out = `out/export/${deckId}.mp4`) {
  return {
    deckFile: path.join(root, 'decks', deckId, 'deck.yaml'),
    buildDir: path.join(root, 'out', 'export', deckId),
    out: path.resolve(root, out),
  };
}

export function parseCaptureArgs(args) {
  if (args.includes('--help') || !args.length) return { help: true };
  const deckId = args[0];
  if (!DECK_ID.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const atIndex = args.indexOf('--at');
  const at =
    atIndex < 0
      ? []
      : String(args[atIndex + 1] ?? '')
          .split(',')
          .filter(Boolean);
  return { deckId, stops: args.includes('--stops'), between: args.includes('--between'), at };
}
