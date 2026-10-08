# Attribution

This page lists what Scrolline borrows and from whom. The code is original and released under [MIT](../LICENSE). It does not include code, images, fonts or brand assets from any reference below.

## Motion techniques

Every move names the techniques it builds on in its `sources` field, for example `sources: ['blur-resolve', 'rack-focus']` in `moves/reveal/focus-pull.js`. The slugs refer to the effect catalogue in [awesome-ai-motion](https://github.com/gongnyang/awesome-ai-motion) by the same author. Those techniques are general motion principles (mask reveal, rack focus, match cut, infinite zoom, rolling digits and so on), reimplemented here against the move contract.

## Reference work (ideas only)

Before the build, scroll stories, product pages, data journalism and keynotes were studied for their motion and pacing. Each deck's direction document in `plan/concepts/` names what it took from each reference, and what it left out. The rule for all of them was to keep the idea and timing principle and drop the code and assets.

| Area | References studied |
|---|---|
| Data journalism | The Pudding, Our World in Data, The New York Times (Snow Fall), The Washington Post, The Guardian |
| Product pages | Apple (AirPods Pro, Vision Pro, MacBook Pro, iPad Pro), Linear, Stripe, Vercel, Nothing |
| Scroll and web craft | Codrops tutorials and demos, FWA case studies, Isolume (Selva), Firewatch, CANALS Amsterdam |
| Timelines | Timeline Traveler, FWDTools, FlowRadar, CamelWeb (Braun 100 years) |
| Presentations | Stripe Sessions, Vercel Ship, OpenAI DevDay, Config, Apple Keynote, Prezi, Pitch, reveal.js, Slidev |
| Film grammar | Charles and Ray Eames, *Powers of Ten* (1977), as the model for the zoom concept |

All names and trademarks belong to their owners. No affiliation or endorsement is implied.

## Media in the example decks

- **Stock footage:** clips from [Pexels](https://www.pexels.com/license/) under the Pexels License. Each clip's source page, creator, download date and edits are listed in `decks/<id>/assets/CREDITS.md`.
- **Rendered media:** product turntables, UI demos and abstract loops were made for this repository with HyperFrames and image generation. The project sources are in `media-hf/`.
- **Sample companies:** decks with `sample: true` (`launch-orbit-note`, `zoom-root-cause`, `canvas-pitch`) use fictional companies and figures, and say so on screen.

## Data in the example decks

`rail-ai-decade`, `data-ev-shift` and `kinetic-next-word` use real data. Each figure, date and quote links to an entry in the deck's `sources` list, which records the title, URL and access date. The publishers include the IEA, Our World in Data, arXiv, OpenAI, Anthropic, Google, Meta, GitHub, Stability AI and Reuters. The model answers shown in `kinetic-next-word` are verbatim outputs of measured runs, recorded in `decks/kinetic-next-word/assets/runs/`.

## Software

| Package | Use | License |
|---|---|---|
| [GSAP](https://gsap.com) | timeline, ScrollTrigger | GreenSock standard no-charge license |
| [Lenis](https://github.com/darkroomengineering/lenis) | smooth scroll | MIT |
| [Vite](https://vite.dev) | dev server and build | MIT |
| [yaml](https://github.com/eemeli/yaml) | `deck.yaml` parsing in tools | ISC |
| [Vitest](https://vitest.dev), [happy-dom](https://github.com/capricorn86/happy-dom) | tests | MIT |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | MP4 export and stop capture (run through `npx`) | Apache-2.0 |

Web fonts (Pretendard, Noto Serif KR, Hahmlet, IBM Plex Sans KR, JetBrains Mono and others) are loaded from their public CDNs by each deck's `index.html` and are not bundled in this repository.
