#!/usr/bin/env node
/** Scrolline deck helper (CONTRACTS C3, C15, C16). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[a-z0-9][a-z0-9-]*$/;
const option = (args, name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};

export function deckTemplate(id, concept) {
  return {
    yaml: `id: ${id}\ntitle: "${id}"\nlang: ko\nconcept: ${concept}\nsample: false\nsources: []\nbeats: []\n`,
    html: `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${id}</title></head><body><div id="app"></div><script type="module" src="./main.js"></script></body></html>\n`,
    main: `import { boot } from '../../engine/index.js';\nimport '../../engine/engine.css';\nimport moves from '../../moves/index.js';\nimport concept from '../../concepts/${concept}/index.js';\nimport '../../concepts/${concept}/tokens.css';\nimport deck from './deck.yaml';\n\nboot({ host: document.getElementById('app'), deck, concept, moves, assetBase: new URL("./", document.baseURI).href });\n`,
  };
}

export function createDeck(id, concept, root = ROOT) {
  if (!ID.test(id) || !ID.test(concept)) throw new Error('deck and concept ids must be lowercase kebab-case');
  const dir = path.join(root, 'decks', id);
  if (fs.existsSync(dir)) throw new Error(`Deck already exists: ${id}`);
  const files = deckTemplate(id, concept);
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const [name, body] of Object.entries(files))
    fs.writeFileSync(
      path.join(dir, name === 'yaml' ? 'deck.yaml' : name === 'html' ? 'index.html' : 'main.js'),
      body,
    );
  return dir;
}

export function moveRows(registry, filters = {}) {
  return registry
    .ids()
    .map((id) => registry.get(id))
    .filter((m) => !filters.family || m.family === filters.family)
    .filter((m) => !filters.role || m.role === filters.role)
    .map((m) => `${m.id}\t${m.family}\t${m.role}`);
}

async function loadMoves(root) {
  return (await import(pathToFileURL(path.join(root, 'moves/index.js')).href)).default;
}

export async function run(
  argv = process.argv.slice(2),
  { root = ROOT, out = console.log, err = console.error } = {},
) {
  const [command, id] = argv;
  if (command === 'new') {
    const concept = option(argv, '--concept');
    if (!id || !concept) throw new Error('new requires <deckId> --concept <id>');
    out(createDeck(id, concept, root));
    return 0;
  }
  if (command === 'moves') {
    for (const row of moveRows(await loadMoves(root), {
      family: option(argv, '--family'),
      role: option(argv, '--role'),
    }))
      out(row);
    return 0;
  }
  if (command === 'plan') {
    if (!id || !ID.test(id)) throw new Error('plan requires a valid <deckId>');
    const deck = parse(fs.readFileSync(path.join(root, 'decks', id, 'deck.yaml'), 'utf8'));
    const [moves, conceptMod, timeline, beats] = await Promise.all([
      loadMoves(root),
      import(pathToFileURL(path.join(root, 'concepts', deck.concept, 'index.js')).href),
      import(pathToFileURL(path.join(root, 'engine/timeline.js')).href),
      import(pathToFileURL(path.join(root, 'engine/beats/index.js')).href),
    ]);
    out(
      JSON.stringify(
        timeline.plan(deck, {
          registry: moves,
          concept: conceptMod.default,
          beatTypes: beats.beatTypes,
          sequences: {},
        }),
        null,
        2,
      ),
    );
    return 0;
  }
  err(
    'Usage: cli.mjs new <deckId> --concept <id> | moves [--family <family>] [--role <role>] | plan <deckId>',
  );
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
