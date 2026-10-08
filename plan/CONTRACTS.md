# Scrolline v2 — 인터페이스 계약 정본 (CONTRACTS)

- 이 문서가 워커 지시서의 인용 원본. 코드가 이 문서와 다르면 코드가 틀린 것.
- 계약 변경은 메인만 한다(이 파일 + `engine/types.js` + `engine/constants.js` 동시 수정, 커밋 1개, `Hat: refactor`).
- 표기: `u` = timeline 단위(GSAP 초와 같은 수, 의미는 「스크롤 거리 단위」). `px` = CSS px. 좌표는 전부 **stage-local**(stage 루트 왼쪽 위 = 0,0).
- 타입 정본은 `engine/types.js`(JSDoc typedef). 이 문서의 TS 표기는 읽기용.

---

## C0. 폴더·파일 위치

| 경로 | 소유 | 내용 |
|---|---|---|
| `engine/index.js` | 메인(동결) | 공개 API 재수출. 다른 층은 이 파일만 import |
| `engine/types.js` | 메인(동결) | JSDoc typedef 정본 |
| `engine/constants.js` | 메인(동결) | 이벤트 이름·CSS 변수 이름·키·정규식 상수 |
| `engine/stage.js` | W2-E1 | `createStage`, `computeViewport` |
| `engine/util/{dom,rng,schema}.js` | W2-E1 | DOM 도우미·seeded RNG·schema 검사 |
| `engine/engine.css` | W2-E1 | 무대 기본 CSS(`--sl-*` 소비) |
| `engine/a11y.js` | W2-E1 | reduced-motion·aria-live·transcript·inert |
| `engine/timeline.js` | W2-E2 | `plan`(순수), `build`, 내장 fallback move |
| `engine/registry.js` | W2-E2 | `createRegistry` |
| `engine/deck-schema.js` | W2-E2 | `validateDeck`, 내용 감사 |
| `engine/scroll.js` | W2-E3 | `createScrollDriver`(Lenis + ScrollTrigger) |
| `engine/presenter.js` | W2-E3 | `createPresenter` 발표 키 |
| `engine/handoff.js` | W2-E4 | `measure`, `anchorOf`, `rectIn`, `toInset`, `transferVars` |
| `engine/testing.js` | W2-E4 | move·beat 테스트 harness(테스트 전용 진입점) |
| `engine/beats/*.js` | W2-E5 | beat 렌더러 10종 + `index.js` |
| `engine/media.js` | W2-E6 | `frameSequence`, `videoClip`, `textMask`, `preloadImages` |
| `tools/media/extract-frames.mjs` | W2-E6 | ffmpeg 프레임 추출 |
| `engine/export.js` | W2-E7 | `exportPath`(순수), `buildExportTimeline` |
| `tools/export.mjs`, `tools/capture.mjs` | W2-E7 | HyperFrames 렌더·스냅샷 래퍼 |
| `engine/boot.js` | W2-E8 | `boot` 통합 진입 |
| `decks/_smoke/**`, `tools/cli.mjs` | W2-E8 | 통합 확인 덱·CLI |
| `moves/<family>/<id>.js` + `<id>.test.js` | W3 family별 1잡 | move 1개 = 파일 1개 + 테스트 1개 |
| `moves/<family>/index.js` | 그 family 잡 | family의 move 배열 export |
| `moves/index.js` | 메인 | family index 묶음 + registry |
| `concepts/<id>/{concept.json,tokens.css,index.js}` | W2 컨셉 잡(opus) → W3 | 컨셉 팩 |
| `decks/<id>/{deck.yaml,index.html,main.js,assets/,sequences/}` | W4 덱 잡 | 덱 |
| `tools/check*.mjs` | 메인 | 게이트 |
| `state/board.json`, `state/runs.jsonl` | 메인만 씀 | 상태 정본 |

- 테스트 파일은 대상 옆에 `<name>.test.js`. 다른 위치 금지.
- 새 engine 파일 추가는 계약 변경(메인 승인).

---

## C1. 의존 규칙 (`tools/check-deps.mjs`가 강제)

- 층 순위: `engine`(0) < `moves`(1) < `concepts`(2) < `decks`(3) < `site`(4). `tools/`와 루트 설정 파일은 층 밖(아무거나 import 가능, 아무도 tools를 import 못 함).
- **R1 하향만**: 파일은 자기 층 이하만 import.
- **R2 공개 진입점만**: 다른 층에서 들어올 때 대상은 다음 중 하나여야 함.
  - `engine/index.js`, `engine/engine.css`, `engine/testing.js`(`*.test.js`에서만)
  - `moves/index.js`
  - `concepts/<id>/index.js`, `concepts/<id>/tokens.css`
- **R3 순환 금지**: 파일 단위 import 그래프 전체에 cycle 0.
- **R4 형제 격리**: `concepts/a` ↛ `concepts/b`, `decks/a` ↛ `decks/b`, `moves/famA` ↛ `moves/famB`(`moves/_shared/`만 예외로 모든 family가 import 가능).
- **R5 외부 패키지**:
  - `gsap`, `gsap/*`: `engine/**`만. moves·concepts·decks는 `ctx.gsap`·`ctx.plugins`로 받는다.
  - `lenis`: `engine/scroll.js`만.
  - `three`: 금지(W2 범위 밖. 히어로 WebGL은 추후 `engine/media-gl.js` 계약 추가 후).
  - `vitest`: `*.test.js`만. `happy-dom`: `engine/testing.js`만.
  - `yaml`: `tools/**`만(덱은 vite plugin이 넘겨준 객체를 받음).
- 검사 대상 확장자 `.js .mjs`. import 형태 `import … from`, `import '…'`, `export … from`, `import('…')` 모두.

---

## C2. 단위·좌표·뷰포트

- `Viewport = { w, h, portrait, px, dpr }`
  - `portrait = w / h <= 1`
  - `px = portrait ? w / 760 : Math.min(w, h * 16 / 9) / 1920` (디자인 기준 1920 가로 / 760 세로)
  - `dpr = Math.min(devicePixelRatio || 1, 2)`
- CSS: engine이 stage 루트에 `--px`(숫자, 단위 없음), `--vw-px`, `--vh-px`(px 단위 문자열), `--sl-portrait`(0|1) 설정. 글자 크기는 `calc(var(--px) * N * 1px)`.
- `Rect = { x, y, w, h }`(stage-local px, transform 이전 layout box 기준). `Point = { x, y }`.
- **timeline 단위 u**: 스크롤 1u = `viewport.h × timing.unit` px. 기본 `unit = 0.55`.
- **track 높이** = `h + duration × h × unit` px.
- **world 좌표**(canvas·zoom 컨셉): `x`, `y` 단위 = 화면 1장(x=1 → 화면 너비만큼 오른쪽), `z` = px 깊이, `s` = 배율. world 원점 = 첫 화면 왼쪽 위.

---

## C3. deck.yaml 스키마

```yaml
id: rail-history            # ^[a-z0-9][a-z0-9-]*$, 폴더 이름과 같음
title: "…"
lang: ko                    # ko | en
concept: rail               # concepts/<id>
sample: false               # true면 가상 회사 표본: 화면에 「표본」 표기 의무, source 면제
sources:                    # 출처 원장(수치·인용·사진은 source id 필수, sample:true 덱 제외)
  - { id: s1, title: "…", url: "https://…", accessed: "2026-10-08" }
timing:                     # 선택. concept.timing 덮어쓰기
  unit: 0.55
  hold: 0.6
  overlap: 0.2
export:                     # 선택. exportPath 옵션 덮어쓰기
  secondsPerUnit: 0.5
beats:
  - id: b-open              # 덱 안에서 유일, ^[a-z0-9][a-z0-9-]*$
    type: text              # C4 beat 종류
    # … type별 필드(C4)
    place: { slot: center } # 또는 { world: { x: 0, y: 0, z: 0, s: 1 } }
    enter: { move: word-rise, params: { stagger: 0.12 }, at: 0 }
    steps:                  # 선택. 머문 뒤 이어지는 동작(차트 변신 등), 각 step 끝에 정지점
      - { name: q4, move: bar-to-line, params: {} }
    exit:  { move: blur-out }
    link:  { move: match-cut, params: { fromPart: frame, toPart: media } }  # 다음 beat로 이음. 있으면 exit 무시
    camera: { move: fly-to, params: {} }   # 선택. beat 시작에 카메라 이동
    ambient: [ { move: ken-burns } ]       # 선택. beat 수명 내내
    stop: true              # 기본 true. false면 주 정지점 없음
    hold: 0.8               # 선택. 정지점 뒤 머무는 u
    at: 0                   # 선택. 앞 beat 기준 시작 오프셋(C6)
    exportHold: 2.0         # 선택. MP4 내보내기에서 이 정지점 머무는 초
    repeat: intended        # 선택. 같은 move 덱 안 2회 이상 허용 사유
```

- `MoveRef = { move: string, params?: object, at?: number, override?: string }`
  - `override`: 컨셉 허용 목록 밖 move를 쓸 때 사유 문자열(없으면 검증 실패).
- 기본값 해석 순서: beat 필드 → `concept.defaults.byType[type].{enter,exit,link}` → `concept.defaults.{enter,exit}` → 내장 `engine:fade-in` / `engine:fade-out`.
- `link`가 있는 beat는 마지막 beat일 수 없음.

### 내용 감사 (`validateDeck`가 강제, luna 사건 대응)
- 모든 문자열 필드에 대해 `PLACEHOLDER_PATTERNS`(engine/constants.js) 매치 시 오류: `TODO`, `TBD`, `lorem`, `ipsum`, `xxx`, `「x」`, `???`, `{{`, `}}`, `<placeholder>`, `자리표`, `예시 문구`, 빈 문자열, 공백만.
- `number.value`, `chart.series[].values`, `quote`, `photo`(실사)에는 `source` 필수(`sample: true` 덱 제외). `source`는 `sources[].id` 중 하나.
- 같은 move id가 덱 안에서 같은 role로 2회 이상 → `repeat: intended` 없으면 오류.
- 컨셉 `moves.allow` 밖 move → `override` 없으면 오류.

---

## C4. beat 종류와 데이터 스키마

- beat 렌더러 = DOM과 part만 만든다. **움직임은 0**(move 몫). 렌더 직후 상태 = 「정지점에서 보이는 완성 상태」.
- 모든 beat 루트: `<section class="sl-beat sl-beat--<type>" data-beat="<id>">`. 렌더러는 class까지 만들고 `data-beat`는 build(테스트에선 harness)가 채운다. 각 part 요소에 `data-part="<name>"`. 루트 자신은 `parts`에 넣지 않는다.
- `parts`는 항상 `Record<string, Element[]>`(하나여도 배열).
- 텍스트는 실제 DOM 글자(canvas 금지). 한국어는 어절 단위(`words`), 타이핑은 글자 단위(`chars`).
- 숫자는 `Intl.NumberFormat(lang)` 포맷. 단위·접두는 별도 span.

| type | 필수 필드 | 선택 필드 | parts | primary |
|---|---|---|---|---|
| `text` | `text: string` | `emphasis: string[]`(부분 문자열), `size: xl\|l\|m`, `lines: string[]`(명시 줄) | `block`, `line`, `word`, `em` | `block` |
| `photo` | `src: asset`, `alt: string` | `focus: {x,y}`(0..1), `caption`, `credit`, `source` | `frame`, `media`, `caption` | `frame` |
| `video` | `src: asset`(mp4), `poster: asset`, `alt`, `mode: scrub\|play\|loop` | `frames: asset`(frames.json, scrub 필수), `caption`, `mask: {type: text\|shape, text?, shape?}`, `source` | `frame`, `media`, `caption` | `frame` |
| `number` | `value: number`, `label: string` | `format: {prefix, suffix, decimals, unit}`, `from: number`(count-up 시작), `source` | `value`, `digits`, `unit`, `label`, `source` | `value` |
| `chart` | `kind: bar\|line\|area\|dot`, `categories: string[]`, `series: [{name, values: number[]}]` | `unit`, `highlight: {series?, index?}`, `states: [{name, kind?, series?}]`(steps용), `source` | `plot`, `axis`, `mark`, `label`, `legend`, `source` | `plot` |
| `chronology` | `events: [{date, title}]`(2개 이상) | `events[].note`, `events[].media`, `scale: even\|time`, `axis: x\|y` | `track`, `event`, `date`, `title`, `note`, `media` | `track` |
| `compare` | `items: [{label}]`(2~4개) | `items[].value`, `items[].text`, `items[].media`, `verdict` | `item`, `label`, `value`, `text`, `divider`, `verdict` | `item` |
| `quote` | `text`, `by` | `role`, `source` | `block`, `mark`, `word`, `by` | `block` |
| `prompt` | `text` | `label`, `result: {type: photo\|text, src?, text?, alt?}` | `field`, `char`, `caret`, `label`, `result` | `field` |
| `code` | `code`, `lang` | `highlight: [[from,to]]`(1-base 줄 범위), `caption` | `block`, `line`, `token`, `caret` | `block` |
| `sequence` | `use: string`(덱 전용 sequence 이름) | `data: any` | sequence가 정의 | sequence가 정의 |

- `chart` 렌더: SVG `viewBox="0 0 1600 900"`, mark마다 `data-series`, `data-index`. 축 눈금은 정적.
- `chronology` 렌더: track 위 event를 `scale`대로 배치. `axis: x`면 가로 레일(rail 컨셉).
- `asset` = 덱 폴더 기준 상대 경로(`assets/…`). 렌더러는 `ctx.asset(path)`로 URL 변환.
- `sequence`(덱 전용): `decks/<id>/sequences/<use>.js` default export = `BeatTypeDef & { timing(data), build(tl, ctx) }`(C5·C7과 같은 시그니처). 엔진은 이 beat의 enter를 sequence 자신의 `build`로 대신한다.

### BeatTypeDef (engine/beats/<type>.js default export)
```ts
{
  type: string,
  fields: FieldSchema,                 // C9 schema 형식
  primary: string,                     // 기본 anchor part
  render(data: object, rc: RenderContext): BeatView
}
RenderContext = { viewport: Viewport, lang: 'ko'|'en', asset(p: string): string, media: MediaApi, el, words, chars }
BeatView = { root: HTMLElement, parts: Record<string, Element[]> }
```

---

## C5. move 계약

```ts
// moves/<family>/<id>.js
export default {
  id: 'match-cut',                       // ^[a-z0-9][a-z0-9-]*$, 전역 유일, 파일 이름 = id
  family: 'morph',                       // 폴더 이름과 같음
  role: 'link',                          // enter | exit | link | step | camera | ambient
  accepts: ['photo', 'video'],           // beat type 목록 또는 ['*']. link는 to beat 기준
  sources: ['morph-match-cut'],          // awesome-ai-motion slug(1개 이상, 원리 차용 포함)
  reduce: 'self',                        // 'self' = ctx.reduce 직접 처리 | 'fade' = 엔진이 같은 길이 fade로 대체
  params: { duration: { type: 'number', default: 1.2, min: 0.2, max: 4, doc: '…' }, /* … */ },
  timing(params, data) { return { duration: params.duration, stops: [] }; },   // 순수 함수
  build(tl, ctx, params) { /* tl = 이 move 전용 local timeline, 0부터 */ },
};
```

- **timing은 순수**: 입력은 `params`(기본값 채운 뒤)와 beat data뿐. viewport·reduce·DOM 측정 금지. 같은 입력 → 같은 출력.
  - 반환 `Timing = { duration: number | 'fill', stops?: Array<{ name: string, at: number }> }`. `'fill'`은 `role: ambient`만.
  - `stops[].at`은 move 시작 기준 상대 u. 이름 `^[a-z0-9][a-z0-9-]*$`.
  - link의 `data` = `{ from: A.data, to: B.data }`.
- **build 규칙**
  - `tl`은 local timeline. 위치 인자는 0 기준. 엔진이 `master.add(tl, span.start)`.
  - 끝나면 엔진이 `tl.duration() <= timing.duration + 0.001` 검사(테스트·dev에서 throw).
  - 시작 전 상태는 `ctx.initial(targets, vars)`로만 선언(엔진이 측정 후 일괄 `gsap.set`). `tl.from()` 금지. `fromTo`는 `immediateRender: false` 필수.
  - tween 값에 `var(` 문자열 금지. 수치는 `ctx.tokens`에서.
  - beat 루트(`ctx.beat.root`) 의 `autoAlpha`·`visibility`·`display` 건드리지 않음(엔진 소유). part만 움직임.
  - `ctx.skipParts`에 든 part는 건드리지 않음(link가 이미 넘겨준 part).
  - 무작위는 `ctx.rng()`만. `Math.random`·`Date.now`·`performance.now` 금지.
  - DOM 추가가 필요하면 `ctx.overlay`(이 move 전용 컨테이너) 안에만. 엔진이 수명 관리.
  - 3D 규칙(C10) 준수.
- **role별 시간 배치**: C6 참고. 

### MoveContext
```ts
{
  gsap, plugins: { SplitText, Flip, MorphSVGPlugin, DrawSVGPlugin, CustomEase },
  role: Role,
  beat: BeatInstance,                 // 대상 beat(link면 to)
  from?: BeatInstance,                // link·exit에서 나가는 beat(link면 A, exit면 beat 자신과 같음)
  prev?: BeatInstance, next?: BeatInstance,
  handoff?: { from: Handoff, to: Handoff },   // link만
  camera?: CameraTarget,              // camera role만: beat.place.world → 목표
  stage: Stage, viewport: Viewport, reduce: boolean,
  start: number, duration: number,    // 절대 시작 u, 이 move 길이(fill 해석 후)
  skipParts: string[],
  overlay: HTMLElement,
  tokens: ConceptTokens,
  ease(alias: 'in'|'out'|'inout'|'scrub'|string): string,   // 컨셉 alias → gsap ease 문자열, 모르는 이름은 그대로
  initial(targets: Element|Element[], vars: object): void,
  rng(): number,                      // [0,1), seed = hashSeed(`${deck.id}:${beat.id}:${role}:${move.id}`)
}
```

### BeatInstance
```ts
{
  id, type, data, place,
  root: HTMLElement,
  parts: Record<string, Element[]>,
  part(name: string): Element[],      // 없으면 []
  anchor(part?: string): Handoff,     // 측정 스냅샷 기준. part 생략 = primary
  span: { start, stop, end },         // TimelineMap 값
}
```

---

## C6. 연속 timeline 모델 (`plan` 알고리즘 정본)

- `plan(deck, { registry, concept, beatTypes, sequences }) → TimelineMap`. **DOM 없이 node에서 돈다**(export·검사·테스트가 같은 결과를 씀).
- timing 해석: `T = { unit, hold, overlap, tail } = { …ENGINE_TIMING_DEFAULTS, …concept.timing, …deck.timing }`. 기본 `unit 0.55, hold 0.6, overlap 0.2, tail 0.8`.
- 알고리즘(정확히 이대로):

```
prev = null
for each beat b (i = 0..n-1):
  linkIn = prev?.link                        // 앞 beat의 link가 b로 들어옴
  if i == 0:          s = 0
  else if linkIn:     s = prev.holdEnd + (b.at ?? 0)
  else:               s = prev.exitStart + (b.at ?? T.overlap)
  s = max(s, prev?.start ?? 0)
  t = s
  if linkIn:  L = timing(linkIn); span(link, s, s + L.duration); t = s + L.duration
  if enter:   E = timing(enter); es = max(s, t + (b.enter.at ?? 0)); span(enter, es, es + E.duration)
              internal stops: es + E.stops[k].at → "stop:<b.id>/<name>"
              stopT = es + E.duration
  else        stopT = t
  if camera:  C = timing(camera); span(camera, s, s + C.duration); stopT = max(stopT, s + C.duration)
  if b.stop !== false: label "stop:<b.id>" at stopT
  cur = stopT + (b.hold ?? T.hold)
  for each step k:  D = timing(step); span(step, cur, cur + D.duration)
                    label "stop:<b.id>/<step.name ?? k+1>" at cur + D.duration
                    cur = cur + D.duration + (step.hold ?? T.hold)
  holdEnd = cur
  if b.link:  exitStart = holdEnd; end = (다음 beat 처리 때 link span 끝으로 채움)
  elif exit:  X = timing(exit); span(exit, holdEnd, holdEnd + X.duration); exitStart = holdEnd; end = holdEnd + X.duration
  else:       exitStart = holdEnd; end = holdEnd     // 마지막 beat가 그대로 남는 경우
  ambient:    span(ambient, s, end)  ('fill'이면 end - s)
  prev = { start: s, holdEnd, exitStart, link: b.link }
duration = max(all span ends, all stop labels) + T.tail
```

- `TimelineMap`:
```ts
{
  version: 1, deck: string, concept: string,
  duration: number, unit: number,
  stops: Array<{ name: string /* 'b-open' | 'b-open/q4' */, label: string /* 'stop:b-open' */, t: number, beat: string }>,  // t 오름차순
  beats: Array<{ id, type, start, stop, end, spans: Array<{ role, move, start, end, params }> }>,
}
```
- **map 불변식**(테스트 대상): ① stops t 오름차순·이름 유일 ② 모든 span `start <= end` ③ `beats[i].start` 비감소 ④ 같은 deck 입력 → JSON 동일 ⑤ **viewport·reduce·portrait와 무관**(그래서 resize 뒤 같은 t가 같은 내용).
- `build(map, { stage, deck, registry, concept, beatTypes, sequences, reduce, gsap, measureFn? }) → BuiltDeck`
  - 순서: ① 모든 beat `render` + `place` 적용 ② `document.fonts.ready` 뒤 `measure`(모든 beat의 모든 part rect 스냅샷, transform 없는 상태) ③ 모든 move의 `ctx.initial` 수집·적용 ④ master `gsap.timeline({ paused: true, defaults: { ease: 'none' } })`에 span별 local tl을 `add` ⑤ 라벨 추가 ⑥ beat 루트 가시성: `gsap.set(root, {autoAlpha:0})`, `tl.set(root, {autoAlpha:1}, start)`, 마지막 beat 아니면 `tl.set(root, {autoAlpha:0}, end)` ⑦ master 길이를 `map.duration`으로 맞춤.
  - reduce && move.reduce === 'fade' → 같은 duration의 내장 move로 대체: enter→`engine:fade-in`, exit→`engine:fade-out`, link→`engine:crossfade`, step→`engine:fade-in`(대상 part 없으면 no-op), ambient→no-op. camera move는 `reduce: 'self'` 필수.
  - `BuiltDeck = { tl, map, beats: BeatInstance[], byId: Map<string, BeatInstance>, destroy() }`.
- 내장 move(`engine:*`): `engine:fade-in`(beat의 모든 최상위 part opacity 0→1), `engine:fade-out`(1→0), `engine:crossfade`(A 전체 1→0, B 1←0, 앞 40% 겹침), `engine:none`(duration 0). registry가 항상 포함.

### 정지점
- 라벨 이름 = `STOP_PREFIX + name`, `STOP_PREFIX = 'stop:'`. 다른 라벨은 자유지만 `stop:`으로 시작하면 정지점으로 취급.
- 첫 beat의 enter가 `engine:none`이면 첫 정지점 t=0.

---

## C7. handoff 계약

```ts
Handoff = {
  beat: string, part: string,
  kind: 'rect' | 'point',
  rect: Rect,              // 측정 스냅샷(stage-local, transform 이전)
  point: Point,            // rect 중심(kind:'point'면 이것만 의미)
  node: Element,           // 그 part의 첫 요소
  style: { color: string, radius: number, fontSize: number },   // getComputedStyle 스냅샷(px 수치)
}
```
- 측정: `measure(stageRoot, beats, measureFn = defaultMeasure) → MeasureSnapshot`(`Map<Element, Rect>`). `defaultMeasure(node, root)` = getBoundingClientRect 차이. 측정은 build ②에서 한 번, 모든 transform 적용 전.
- `anchorOf(beat, part?, snapshot) → Handoff`. `BeatInstance.anchor(part)`는 이것을 부른다.
- **소유권 규칙(link)**:
  - link 시작 시 A의 `handoff.from.node`를 움직여 `handoff.to.rect`로 보낸다(또는 overlay에 대역을 만들어 보냄).
  - link 끝 시각에: B의 대상 part(`handoff.to.part`)는 보임(`ctx.initial`로 숨겨 두었다가 끝에 `tl.set(…, {autoAlpha:1}, end)`), A의 대역·원본은 숨김.
  - 두 개가 동시에 보이는 구간은 crossfade 0.15u 이하.
  - 엔진은 B의 enter move에 `skipParts = [handoff.to.part]`를 넘긴다.
- 도우미(engine/handoff.js):
  - `rectIn(node, root) → Rect`
  - `toInset(rect, viewport) → string` (`inset(top right bottom left)` clip-path 값)
  - `transferVars(fromRect, toRect) → { x, y, scaleX, scaleY, transformOrigin: '0 0' }` (from 요소를 to 자리로 보내는 GSAP vars)

---

## C8. Stage·카메라

```ts
createStage(host: HTMLElement, { viewport: Viewport, concept: ConceptPack, mode: 'live'|'export' }) → Stage
Stage = {
  root: HTMLElement,        // .sl-stage  (fixed, 100vw×100vh; export면 1920×1080)
  viewportEl: HTMLElement,  // .sl-viewport (perspective: var(--sl-perspective))
  camera: HTMLElement,      // .sl-camera   (transform-style: preserve-3d) ← camera role만 움직임
  world: HTMLElement,       // .sl-world    (place.world beat가 들어감)
  screen: HTMLElement,      // .sl-screen   (place.slot beat가 들어감, 카메라 영향 없음)
  overlay: HTMLElement,     // .sl-overlay  (move overlay 컨테이너들의 부모, 최상단)
  viewport: Viewport,
  placeBeat(root: HTMLElement, place: Place): void,
  cameraVars(target: CameraTarget): object,   // .sl-camera에 줄 GSAP vars
  overlayFor(key: string): HTMLElement,       // move별 전용 컨테이너(없으면 생성)
  clear(): void,
}
Place = { slot: Slot } | { world: { x: number, y: number, z?: number, s?: number } }
Slot = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'full' | 'lower-third'
CameraTarget = { x: number, y: number, s: number, rx?: number, ry?: number }  // world 단위, rx·ry 도(°)
```
- slot은 CSS class `sl-slot-<slot>`. 위치는 concept tokens(C11)로 조정.
- `cameraVars({x,y,s,rx,ry})` = 목표 world 점이 화면 중앙에 오도록 `.sl-camera`의 `x, y, scale, rotationX, rotationY, transformOrigin`. |rx|,|ry| ≤ 12 강제(clamp + dev 경고).

---

## C9. schema 형식 (move params·beat fields 공통)

```ts
FieldSchema = Record<string, Field>
Field = {
  type: 'number'|'integer'|'string'|'boolean'|'enum'|'ease'|'part'|'asset'|'array'|'object'|'any',
  default?: any, required?: boolean,
  min?: number, max?: number,       // number·integer
  values?: string[],                // enum
  of?: Field,                       // array
  fields?: FieldSchema,             // object
  doc: string,                      // 필수. 한 줄 설명
}
resolveParams(schema, given) → resolved   // 기본값 채움, 알 수 없는 키·범위 위반·필수 누락 = SchemaError
validateSchema(schema, value, path) → Array<{ path: string, message: string }>
```
- move params는 전부 `default`가 있어야 함(`required` 금지). beat fields는 `required` 사용 가능.

---

## C10. 3D 규칙

- 설명용 3D 오브젝트 금지(도는 물체·와이어프레임·회전 카드).
- `rotationX`·`rotationY`·`rotateX`·`rotateY`·`z`·`translateZ`·`transformPerspective`·`perspective` tween은 **`family: camera` move만**, 대상은 `ctx.stage.camera` 또는 `[data-depth]` 층만.
- 카메라 tilt |rx|,|ry| ≤ 12°. 깊이 패럴랙스는 `data-depth`(0=먼, 1=가까운) 층의 이동량 차이로.
- WebGL: W2 범위 밖. 덱당 최대 1곳(히어로)만 추후 계약으로 허용.
- `tools/check-moves.mjs`(W3)가 정적 검사: 위 속성 문자열이 camera family 밖에 있으면 실패, `.from(` 실패, `var(` tween 실패, `Math.random|Date.now|performance.now` 실패.

---

## C11. 컨셉 팩

`concepts/<id>/concept.json`:
```json
{
  "id": "rail",
  "name": "가로 레일 연표",
  "axis": "x",
  "camera": { "mode": "rail", "perspective": 1600 },
  "timing": { "unit": 0.55, "hold": 0.6, "overlap": 0.2 },
  "eases": { "in": "power2.in", "out": "power3.out", "inout": "power2.inOut", "scrub": "none" },
  "beats": { "allow": ["text", "chronology", "photo", "number", "quote", "video"] },
  "moves": {
    "allow": ["rail-pan", "word-rise", "match-cut"],
    "signature": ["rail-pan"]
  },
  "defaults": {
    "enter": "word-rise", "exit": "blur-out",
    "byType": { "chronology": { "enter": "rail-pan" } }
  },
  "slots": { "center": { "x": 0.5, "y": 0.5 } },
  "tokens": { "blurMax": 6, "depthNear": 1.0, "depthFar": 0.55, "stagger": 0.08 }
}
```
- `signature`: 이 컨셉을 다른 컨셉과 구별하는 move(덱에서 1회 이상 써야 함, W5 다양성 게이트).
- `tokens` = `ctx.tokens`(수치만, JS에서 읽음). 색·글꼴은 tokens.css.
- `concepts/<id>/index.js`: `import concept from './concept.json' with { type: 'json' }; export default concept;`
- `tokens.css`: `.sl-concept-<id>` 범위에 아래 CSS 변수만 정의(이름 고정, 추가는 계약 변경):

| 변수 | 뜻 |
|---|---|
| `--sl-bg` `--sl-fg` `--sl-fg-muted` `--sl-accent` `--sl-accent-2` `--sl-rule` `--sl-scrim` | 색 |
| `--sl-font-display` `--sl-font-text` `--sl-font-mono` | 글꼴 family |
| `--sl-weight-display` `--sl-weight-text` | 굵기 |
| `--sl-size-xl` `--sl-size-l` `--sl-size-m` `--sl-size-s` `--sl-size-caption` | 글자 크기(`calc(var(--px) * N * 1px)`) |
| `--sl-leading-display` `--sl-leading-text` `--sl-tracking-display` | 행간·자간 |
| `--sl-perspective` | `.sl-viewport` perspective(px) |
| `--sl-gutter` `--sl-radius` | 여백·모서리 |

- engine이 정의하는 변수(컨셉이 덮어쓰지 않음): `--px`, `--vw-px`, `--vh-px`, `--sl-portrait`.

---

## C12. 스크롤 드라이버·발표 키·이벤트

```ts
createScrollDriver({ track: HTMLElement, tl, map: TimelineMap, viewport: Viewport, reduce: boolean }) → ScrollDriver
ScrollDriver = {
  attach(): void, detach(): void,
  timeToY(t: number): number, yToTime(y: number): number,
  time(): number,                                  // 현재 timeline 시각
  seek(t: number, opts?: { immediate?: boolean, duration?: number }): void,
  stops(): Array<{ name, label, t, y, beat }>,
  lenis, st,                                       // 내부 객체(테스트·디버그용)
}
```
- `attach`: track 높이 = C2 식. ScrollTrigger `{ trigger: track, start: 'top top', end: 'bottom bottom', scrub: true, animation: tl }`. Lenis `reduce ? { smoothWheel: false, lerp: 1 } : { lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true }`. `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`.
- `timeToY(t) = st.start + (t / map.duration) * (st.end - st.start)`.

```ts
createPresenter(driver: ScrollDriver, { reduce, target = window }) → Presenter
Presenter = { next(), prev(), first(), last(), goto(name: string), blackout(on?: boolean), destroy() }
```
- 키(`PRESENTER_KEYS`):
  - 다음: `ArrowRight` `ArrowDown` `PageDown` `Space`(Shift 없이)
  - 이전: `ArrowLeft` `ArrowUp` `PageUp` `Shift+Space`
  - 처음·끝: `Home` `End`
  - 블랙아웃 토글: `b` `.`
  - 전체화면 토글: `f`
- 메타·Ctrl·Alt 조합은 무시. 링크·버튼·input에 포커스가 있으면 Space·Enter 양보.
- 다음 정지점 = 현재(진행 중 목표 우선) 시각보다 `0.01u` 이상 뒤의 첫 stop. 이동 시간(초) = `min(2.6, 0.9 + |Δy| / h × 0.35)`, easing = cubic inOut. reduce면 즉시 이동.
- URL 파라미터: `?t=<u>`(시작 시각), `?stop=<name>`, `?motion=reduce`(강제 reduce), `?debug=1`(HUD: t·stop·beat).

### window 이벤트 (`EVENTS`, 전부 `CustomEvent`, detail 고정)
| 이름 | detail | 발생 |
|---|---|---|
| `scrolline:ready` | `{ map, mode }` | 첫 build 완료 |
| `scrolline:rebuild` | `{ reason: 'resize'\|'fonts'\|'hot', time }` | 재빌드 완료 |
| `scrolline:stop` | `{ name, index, beat }` | 발표 키 도착 또는 스크롤 150ms 정지 시 현재 t가 stop ±0.02u |
| `scrolline:active` | `{ beat, phase: 'enter'\|'leave' }` | beat span 진입·이탈(a11y inert 토글용) |
| `scrolline:blackout` | `{ on }` | 블랙아웃 토글 |
| `scrolline:export-ready` | `{ duration }` | export 모드 wrapper 등록 직후 |

### window.__deck (디버그·캡처 API)
```ts
{ version: 2, mode, map, tl, time(): number, seek(t): void, goto(name): void, stops(): Stop[] }
```

### resize 재계산 규칙
- debounce 200ms. 폭이 같고 높이 변화 < 15%면 무시(모바일 주소창).
- 그 외: 현재 t 기억 → `stage.clear()` → viewport 재계산 → `build` 재실행(map은 그대로 재사용) → `driver.seek(t, { immediate: true })` → `scrolline:rebuild`.
- 폰트 로드 완료 후 1회 재측정 build(`reason: 'fonts'`).

---

## C13. media 계약

```ts
frameSequence(host: HTMLElement, manifest: FramesManifest | string /*url*/, opts?: { fit?: 'cover'|'contain', tier?: number }) → FrameSeq
FrameSeq = { canvas: HTMLCanvasElement, count: number, setProgress(p: number): void, setFrame(i: number): void, ready(): Promise<void>, preloadAll(): Promise<void>, destroy(): void }
```
- `FramesManifest`(`frames.json`): `{ version: 1, fps, count, width, height, pattern: 'f_%04d.webp', tiers: { "1920": "1920/", "960": "960/" }, poster: 'poster.webp' }`. 프레임 경로 = manifest 폴더 + tiers[tier] + pattern(1-base).
- tier 선택: `viewport.w × dpr ≥ 1400` → 가장 큰 tier, 아니면 960.
- 로딩 순서: poster → 8장 간격(coarse) → 현재 위치 ±12장 → 나머지. 그리기 = 목표 프레임이 없으면 **가장 가까운 앞쪽 로드된 프레임**(되감기 안정).
- `setProgress`는 timeline tween의 `onUpdate`에서만 부름(스크럽 결정론).

```ts
videoClip(host, { src, poster, loop, mode: 'play'|'loop' }, { exportMode: boolean }) → Clip
Clip = { el: HTMLVideoElement, activate(): void, deactivate(): void, bindExport({ start, duration }): void, destroy(): void }
```
- live: `<video muted playsinline preload="metadata">`, `scrolline:active` enter에서 `activate()`(play), leave에서 `deactivate()`(pause, currentTime 유지).
- export: `bindExport`가 `data-start`(초, 루트 기준), `data-duration` 설정. JS로 play·seek 하지 않음(HyperFrames 소유). `crossorigin` 속성 금지.

```ts
textMask(text: string, { font: string /* CSS font 축약 */, width: number, height: number, align?: 'center'|'left' }) → string   // data:image/svg+xml URL, mask-image 값으로 사용
preloadImages(urls: string[]) → Promise<void>      // img.decode() 전부 대기
```
- 영상 마스크: 대상 `.sl-mask` 요소에 `mask-image: url(...)` 또는 `clip-path`. 마스크 move는 `--sl-mask-*`가 아니라 GSAP으로 `clipPath`·`maskPosition`·`maskSize`를 tween.

`tools/media/extract-frames.mjs`:
```
node tools/media/extract-frames.mjs <input.mp4> <outDir> [--fps 24] [--tiers 1920,960] [--quality 78] [--from 0] [--to <sec>]
→ <outDir>/frames.json, <outDir>/poster.webp, <outDir>/<tier>/f_0001.webp …
```
- ffmpeg 필수(`ffmpeg -version` 실패 시 exit 2). 산출 count·크기를 frames.json에 기록.

---

## C14. export 계약 (덱 → MP4, HyperFrames)

```ts
EXPORT_DEFAULTS = { width: 1920, height: 1080, fps: 30, secondsPerUnit: 0.5, stopHold: 1.6, travelMin: 0.6, travelMax: 5, lead: 0.4, tail: 1.2, ease: 'power1.inOut' }
exportPath(map: TimelineMap, opts?, holds?: Record<stopName, seconds>) → ExportPath   // 순수
ExportPath = {
  duration: number,         // 초
  segments: Array<{ kind: 'lead'|'travel'|'hold'|'tail', from: number /*u*/, to: number /*u*/, start: number /*s*/, end: number /*s*/ }>,
  stopAt: Record<string, number>,   // stop 이름 → 영상 초(정지 구간 중앙)
}
buildExportTimeline(master, path, gsap) → wrapper   // paused gsap timeline, 길이 = path.duration
toExportSeconds(path, t /*u*/) → number             // 영상 안 in-scene video data-start 계산용
```
- 경로: lead(t=0 정지) → 각 stop 사이 travel(초 = clamp(Δu × secondsPerUnit, travelMin, travelMax), ease) → stop마다 hold(`beat.exportHold ?? stopHold`) → 마지막 stop 뒤 map 끝까지 travel → tail.
- wrapper = `gsap.timeline({ paused: true })`에 `master.tweenFromTo(from, to, { duration, ease })`를 segment 시작 초에 `add`. hold는 위치 인자로 비워 둠(빈 tween 금지).
- export 모드 boot: viewport 고정 1920×1080, reduce=false, scroll driver·presenter 없음, frameSequence `preloadAll()`·폰트·이미지 decode 대기 후 `window.__timelines['scrolline'] = wrapper`(등록은 build 완료 **뒤**), 이어서 `scrolline:export-ready`.
- 루트 HTML: `<div id="scrolline-root" data-composition-id="scrolline" data-width="1920" data-height="1080" data-duration="<path.duration>">`. `data-duration`은 `tools/export.mjs`가 node에서 `plan`+`exportPath`로 계산해 정적으로 박는다.
- `tools/export.mjs <deckId> [--fps 30] [--out out/export/<deckId>.mp4]`: ① node에서 plan·exportPath ② `vite build` export 진입(`SCROLLINE_MODE=export SCROLLINE_DECK=<id>`) → `out/export/<id>/` ③ `npx hyperframes lint` ④ `npx hyperframes render`. Playwright 금지.
- `tools/capture.mjs <deckId> [--stops] [--at s1,s2]`: export 빌드에 대해 `npx hyperframes snapshot`으로 정지점 중앙(`stopAt`)·정지점 사이 중간 프레임 PNG → `out/capture/<id>/`. 실패 시 exit ≠ 0, `manifest.json`(파일·t·stop) 기록.

---

## C15. boot

```ts
boot({
  host: HTMLElement, deck: object /* deck.yaml 파싱 결과 */, concept: ConceptPack, moves: Registry,
  sequences?: Record<string, BeatTypeDef & SequenceDef>, assetBase: string, mode?: 'live'|'export',
}) → Promise<DeckHandle>
DeckHandle = { map, built: BuiltDeck, driver?: ScrollDriver, presenter?: Presenter, rebuild(reason): Promise<void>, destroy(): void }
```
- 순서: `validateDeck` 실패 시 화면에 오류 목록을 그리고 throw → `plan` → viewport → `createStage` → `build` → (live) driver·presenter·a11y·resize / (export) `buildExportTimeline` 등록.
- 덱 진입 파일 형태(`decks/<id>/main.js`):
```js
import { boot } from '../../engine/index.js';
import '../../engine/engine.css';
import moves from '../../moves/index.js';
import concept from '../../concepts/<concept>/index.js';
import '../../concepts/<concept>/tokens.css';
import deck from './deck.yaml';
boot({ host: document.getElementById('app'), deck, concept, moves, assetBase: import.meta.env.BASE_URL });
```

---

## C16. registry

```ts
createRegistry(defs: MoveDef[]) → Registry
Registry = { get(id): MoveDef /* 없으면 throw */, has(id): boolean, ids(): string[], byFamily(f): MoveDef[], byRole(r): MoveDef[] }
```
- 생성 시 검사: id 유일·형식, family·role 유효, `params` 모든 키 `default`·`doc` 보유, `timing`·`build` 함수, `sources` 1개 이상. 위반 = throw.
- `engine:*` 내장 move 자동 포함.
- `moves/index.js`(메인 소유): `import { createRegistry } from '../engine/index.js'; import reveal from './reveal/index.js'; … export default createRegistry([...reveal, ...]);`

---

## C17. 테스트·CI 명령

| 명령 | 내용 | 통과 기준 |
|---|---|---|
| `npm test` | `vitest run` (환경 happy-dom, 대상 `{engine,moves,concepts,decks,tools}/**/*.test.{js,mjs}`) | 전부 녹색 |
| `npm run check` | `node tools/check.mjs` = check-deps + check-tests(모듈마다 테스트) + check-state(board·runs 스키마) | exit 0 |
| `npm run ci` | `npm test && npm run check` | main 병합 조건 |
| `npm install --cache /mnt/d/_cache/npm` | `.npmrc`의 `legacy-peer-deps=true` 전제(npm 10.9 arborist가 vitest 5·vite 8 peer 묶음에서 죽음) | 워커는 설치 금지, 메인만 |
| `node tools/check.mjs --hat <base>..<head>` | 두 모자 검사 | feature: 테스트 파일 추가·수정 1개 이상 / refactor: 기존 `*.test.js` 수정 0(이름 변경만 허용) |

- 커밋 trailer: 병합 커밋마다 `Hat: feature|refactor` 한 줄(check-hat 대상).
- **check-tests 규칙**: `engine/**/*.js`·`moves/**/*.js`(테스트·`index.js`·`types.js`·`constants.js`·`testing.js`·`moves/_shared/` 제외)마다 옆에 `.test.js` 필수. 단 파일 첫 30줄 안에 `@stub` 표기가 있으면 면제(스캐폴드 상태). 워커는 구현 시 `@stub`을 지우고 테스트를 넣는다.
- **engine 모듈 테스트 최소 항목**
  - timeline: map 불변식 ①~⑤, 고정 fixture 덱의 stop t 값 정확 일치, fallback move 대체 시 map 동일
  - stage: viewport 식(1920×1080, 390×844, 1280×1024), slot class, cameraVars clamp
  - handoff: `transferVars` 수치, `toInset` 문자열, 측정 스냅샷이 transform 무시
  - scroll: `timeToY`/`yToTime` 왕복, track 높이 식(Lenis·ScrollTrigger는 vi.mock 허용)
  - presenter: 키 → next/prev 선택 규칙, 포커스 양보, reduce 즉시 이동
  - media: tier 선택, 로딩 순서, 가장 가까운 앞 프레임 규칙(이미지는 가짜 객체)
  - export: path 합계 = duration, segment 연속, stopAt 위치, wrapper seek 결정론
- **move 테스트 최소 항목**(`engine/testing.js`의 harness 사용)
  1. `createRegistry([move])` 통과(형식)
  2. timing 순수: 같은 입력 2회 → deepEqual, 기본 params로 duration > 0(ambient 제외)
  3. build 길이: local tl duration ≤ timing.duration + 0.001
  4. seek 결정론: `seek(a)` 스냅샷 → `seek(b)` → `seek(a)` 스냅샷 동일
  5. 되감기: `seek(end)` → `seek(0)` 후 대상 inline style = `initial` 상태
  6. reduce: `reduce: true`에서 `filter`에 blur 없음, 3D 속성 없음(camera 제외)
  7. link만: 끝 시각에 to part 보임·from 숨김, 운반 노드 최종 rect ≈ `handoff.to.rect`(±1px, harness 가짜 측정)

### engine/testing.js (harness)
```ts
createHarness({ beats: Array<{ id, type, data, place? }>, viewport?: Partial<Viewport>, reduce?: boolean, rects?: Record<string /* `${beatId}.${part}` */, Rect>, concept?: Partial<ConceptPack> }) → Harness
Harness = {
  stage: Stage, beats: Map<string, BeatInstance>,
  runMove(move: MoveDef, { role, beat, from?, params? }) → { tl, ctx, timing },   // local tl를 master 0에 add
  seek(t: number): void,
  snapshot(nodes: Element[], props?: string[]): object,   // gsap.getProperty 값 + inline style
  destroy(): void,
}
```
- harness는 happy-dom 위에서 돌고, 측정은 `rects` 값으로 대체(happy-dom은 layout 없음). 기본 rect는 `{x:0,y:0,w:100,h:100}`.

---

## C18. 상태 기록 (state/)

- `state/board.json` — 현재 상태 스냅샷. 스키마 `state/schema/board.schema.json`. 메인만 수정.
- `state/runs.jsonl` — append-only 이벤트 로그, 한 줄 = 한 레코드. 스키마 `state/schema/runs.schema.json`. 메인만 append.
- **run 줄**(`kind` 생략 또는 `"run"`): 잡 시작 때 1줄(`status: running`), 끝날 때 같은 `run_id`로 1줄 더(`success|error|cancelled`). **같은 run_id의 마지막 줄이 현재 상태.**
  - 필수: `run_id`(hex32), `parent_run_id`(null = 루트), `root_run_id`, `run_type`(`wave|research|design|build|judge|render|repair`), `name`, `status`(`queued|running|success|error|cancelled`), `started_at`
  - 선택: `trace`, `model`(`codex gpt-5.6-terra medium` · `claude-opus` 등), `hat`(`feature|refactor|none`), `target`(`{kind: deck|move|engine|concept|site|research, id}`), `inputs`(`{brief, brief_sha256, files: {path: sha256}}`), `outputs`(`{files: {path: sha256}, commit}`), `error`, `ended_at`, `tokens`(`{input, output, total}` 또는 null), `tags`
  - 웨이브 = `run_type: wave` 루트 run(trace). 잡 run의 `parent_run_id` = 웨이브 run_id.
- **feedback 줄**(`kind: "feedback"`): 판정 1건. 필수 `feedback_id`, `run_id`(대상 run), `key`(`wow|tech|content|diversity|a11y`), `score`(0~1), `by_run_id`(판정 run), `time`. 선택 `value`(PASS|FAIL 등), `comment`.
- 시각 형식 `YYYY-MM-DDTHH:MM:SS`(시간대 생략 = KST).
- `npm run check`가 두 파일 스키마 검사(파일 없으면 통과).

---

## C19. engine/index.js 공개 이름 (전부, 이 밖은 없음)

- 함수: `createStage` `computeViewport` `el` `words` `chars` `createRng` `hashSeed` `resolveParams` `validateSchema` `prefersReducedMotion` `createA11y` `plan` `build` `resolveTiming` `createRegistry` `validateDeck` `createScrollDriver` `createPresenter` `measure` `defaultMeasure` `anchorOf` `rectIn` `toInset` `transferVars` `frameSequence` `videoClip` `textMask` `preloadImages` `pickTier` `loadOrder` `exportPath` `buildExportTimeline` `toExportSeconds` `boot`
- 상수·클래스: `VERSION` `STOP_PREFIX` `ID_PATTERN` `ROLES` `BEAT_TYPES` `SLOTS` `FAMILIES` `ENGINE_MOVES` `REDUCE_FALLBACK` `ENGINE_TIMING_DEFAULTS` `VIEWPORT` `MAX_TILT` `CAMERA_ONLY_PROPS` `EVENTS` `PRESENTER_KEYS` `PRESENTER_TRAVEL` `RESIZE` `CSS_VARS` `PLACEHOLDER_PATTERNS` `EXPORT_DEFAULTS` `FRAMES` `ENGINE_MOVE_DEFS` `SchemaError` `beatTypes`
- `engine/contract.test.js`가 이 목록과 정확히 일치하는지 검사(메인 소유).
