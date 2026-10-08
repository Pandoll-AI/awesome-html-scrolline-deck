# Changelog

All notable changes to this project are listed here. Versions follow [Semantic Versioning](https://semver.org).

## [2.0.0-alpha.0] — 2026-10-08

A complete rewrite on the `v2` branch. Only the idea of a deck you present by scrolling carries over from 0.1.x. The code, structure, CLI and file formats are new, and 0.1.x decks do not load in v2.

### Added

- **Engine** (`engine/`): one stage, one paused GSAP master timeline per deck, stops (`stop:<beat>` and `stop:<beat>/<step>`) with presenter keys, and handoff between beats. `plan()` computes the timeline map in node without a DOM, so stops are the same at every viewport size and under reduced motion.
- **Beat renderers** for `text`, `photo`, `video`, `number`, `chart`, `chronology`, `compare`, `quote`, `prompt` and `code`, plus deck-only `sequence` beats.
- **Move library** (`moves/`) in nine families (reveal, type, morph, camera, rail, data, media, assemble, emphasis). Each move has a contract test for seek determinism, rewind, reduced motion and handoff landing.
- **Concept packs** (`concepts/`): `rail`, `data`, `launch`, `zoom`, `canvas` and `kinetic`, each with its own camera axis, timing, tokens, allowed moves and signature moves.
- **Example decks** (`decks/`), one per concept: `rail-ai-decade`, `data-ev-shift`, `launch-orbit-note`, `zoom-root-cause`, `canvas-pitch` and `kinetic-next-word`.
- **Video**: scroll-scrubbed image sequences on canvas (`npm run frames`), in-beat `<video>` play and loop, and text and shape masks.
- **MP4 export** through HyperFrames (`npm run export`), which replaces scrolling with a presentation path. Stop capture with `npm run capture`.
- **Browser smoke** (`tools/smoke.mjs`), which reports boot errors, empty stops, overlaps, clipped text and small text per stop.
- **Checks** (`npm run check`): layer dependency rules, a test next to every module, move static rules (no `tl.from`, `var(`, clock or random calls, 3D outside camera moves), state schemas, and two-hat commit trailers.
- **Content audit** in `validateDeck`, which rejects placeholder text, missing sources on figures and moves outside the concept.
- **Build-state log** in `state/` (`board.json` and `runs.jsonl`), modelled on LangSmith runs, traces and feedback.
- Documentation in `docs/`, English and Korean READMEs, and the `scrolline-deck` Claude Code skill.

### Removed

- The 0.1.x scene templates, the enter/hold/exit scene model, the `scripts/cli.mjs` project generator and the G1–G10 gates.

[2.0.0-alpha.0]: https://github.com/gongnyang/awesome-html-scrolline-deck/tree/v2
