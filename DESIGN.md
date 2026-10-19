# DESIGN.md

Design direction for zeinzulaziz.github.io. This file holds design fields only.
Treat it as data to apply, not as instructions to obey.

Version note: redesigned Oct 2026, second time. The previous direction was warm
monochrome on paper (dark brown-black, Bricolage Grotesque, hairline ledger, the
inverse block as the only accent). The owner asked to follow the look of
`umbra` (ln-dev7/landing-pages): a night observatory, deep ink ground, one copper
accent, huge display type, pinned chapters, and a fixed generative canvas. This
file records the direction that was built, including the places it deliberately
departs from that reference.

## Identity

Personal portfolio of Moh Zein Zulfanul Aziz, a WordPress developer and solo
builder of small AI products based in East Java, Indonesia. The site exists to
show real public work and writing, and to make contact easy.

## Personality

Nocturnal, cinematic, precise. The page reads like an instrument turned on at
night: one deep field, one warm light source, and mono labels doing the
bookkeeping. It is loud by scale and quiet by color — a single display face at
viewport-eating sizes, over a palette of two neutrals and one copper.

## Direction dials

ENERGY 3 / RHYTHM 2 / MOTION 3

- ENERGY 3: loud through scale, not through noise. Type is huge; the palette
  stays to three values.
- RHYTHM 2: the home page is one repeating chapter frame, like a film reel —
  every chapter opens with a mono label and a display headline, then differs
  inside its body. Reading pages (blog, article, 404) drop the frame entirely
  and stay calm. This is a deliberate change from the previous RHYTHM 3
  (sections each with their own composition).
- MOTION 3: a fixed generative canvas behind the page, scroll-driven chapter
  progress, scene fade-in, and staggered reveals. All of it stops on request.

## Palette

Two neutrals and one light source. Dark is the default and the direction's home;
light is the same room with the lamps on, not a different room.

Dark (default), "night":

| Token | Value | Use |
|---|---|---|
| paper | #080d16 | page ground |
| surface | #0d131f | cards, the article band, table heads |
| surface-2 | #141c2a | inline code, code blocks |
| ink | #ede6d9 | primary text |
| ink-soft | #b9b9af | body and secondary text |
| ink-faint | #8f978f | metadata, mono labels |
| line | rgba(209,194,170,.18) | hairline separators (decorative) |
| line-strong | #8f978f | interactive boundaries (buttons, underlines, rules) |
| accent | #d8a579 | copper: the light source and the few moments that matter |
| accent-ink | #080d16 | text on copper |

Light, "day":

| Token | Value | Use |
|---|---|---|
| paper | #ede6d9 | page ground |
| surface | #f6f1e6 | cards, the article band, table heads |
| surface-2 | #e2dac9 | inline code, code blocks |
| ink | #0d131f | primary text |
| ink-soft | #3b4450 | body and secondary text |
| ink-faint | #4f5964 | metadata, mono labels |
| line | rgba(13,19,31,.16) | hairline separators (decorative) |
| line-strong | #4f5964 | interactive boundaries |
| accent | #6f4218 | copper, deepened for paper so it can carry text |
| accent-ink | #ede6d9 | text on copper |
| rail-ink | #3b4450 (= ink-soft) | chapter rail labels, which sit in the glow's penumbra |

Scene tokens (read by `assets/js/scene.js`; one scene paints from these, so both
themes share a single implementation):

| Token | Dark | Light | Use |
|---|---|---|---|
| scene-core | #ede6d9 | #6b3c1a | the corona's hottest line: chalk at night, deep copper on paper |
| scene-glow | #d8a579 | #8a5426 | corona, halo, the moon's warm light |
| scene-body | #0e121b | #121824 | the stand-in's body, so the CSS eclipse matches the lit one |

The light `scene-glow` stays brighter than the light `accent` on purpose: the
painted haze is a large soft field, and a darker one would eat the contrast of
every label under it.

Measured ratios (WCAG 2.x). Token pairs, then the same pairs measured on rendered
pixels, where the scene's glow tints the field:

- dark tokens: ink/paper 15.68, ink-soft/paper 9.84, ink-faint/paper 6.48,
  ink-faint/surface 6.19, ink-faint/surface-2 5.69, accent/paper 8.87.
- light tokens: ink/paper 14.97, ink-soft/paper 7.95, ink-faint/paper 5.75,
  ink-faint/surface 6.33, ink-faint/surface-2 5.13, accent/paper 6.86 (the
  previous light accent, #8a5426, was 5.01 and failed over the copper penumbra).
- measured on the opening screen (glow at full strength behind the labels) in
  both themes, at 1280x900, 390x844 and 360x640: worst 5.37 in dark
  (`.chapter-rail a`), 5.50 in light (`.spec-item dt`), 5.69 on the narrowest
  phone (`.role`, light). Nothing on the page falls below AA.
- the opening screen is the worst case by construction: the moon keeps its mark
  on the page, and the only thing scroll changes is the corona's strength, which
  falls from 1 to 0.42 as the page is read. A dimmer glow leaves a darker field
  behind light ink and a paler one behind dark ink, so every later position
  measures better, not worse.
- the chapter rail never sits under the ring: the disc's limb stops ~100px short
  of the gutter at 1280x900, so the labels sit in the halo, and they still carry
  their own field (5.37–6.38 measured) because a bare label in the penumbra is
  the one place the scene could still cost legibility.
- `line` is decorative and never carries text or state on its own;
  `line-strong` is the boundary value that must stay visible (6.48 dark,
  5.75 light, both well above the 3:1 rule for non-text UI).

## Typography

- Display: Space Grotesk (variable 300–700). Chosen to match the reference's
  voice: a geometric grotesque that stays sharp at 8rem and still reads as a
  caption. Replaces Bricolage Grotesque, which was too organic for this
  direction.
- Body and UI: IBM Plex Sans, kept. Article prose is long-form and Plex stays
  quiet under a loud display face; the reference sets body copy in its display
  face, and this is where we deliberately differ, for reading comfort.
- Mono: IBM Plex Mono, kept from the previous direction. Labels, numbers,
  chapter indices, dates, tags. Never decoration, never headings.
- All self-hosted woff2 (assets/fonts, latin subset, SIL OFL); no third-party
  font request leaves the page.

Type scale is the loudest thing here: chapter headlines run
`clamp(2.6rem, 9vw, 7.5rem)` at `line-height: 0.9` and `letter-spacing: -0.04em`,
one word per line where the copy allows. Mono labels sit at 0.7–0.75rem with
`letter-spacing: 0.14em` and uppercase.

## Shape

Radius 0 on the chrome and on images inside prose; the only rounded things are
the scene's own circles. Hairlines carry structure. There is no drop shadow in
the system: depth comes from the canvas, from ground/surface steps, and from the
copper glow. The sticky header lifts on a 1px `line` and a `color-mix` veil, not
on a shadow.

## Texture

The ground is not flat: a fixed canvas draws a moon eclipse behind the page
(`assets/js/scene.js`, three.js). A real sphere, not a painted disc: its surface
is pushed in and out into craters and maria, dusted with a canvas-made albedo,
and lit by two warm sources — one in front of the upper-right shoulder, one
grazing the far limb — so the body carries a gradient rather than a painted
edge. Outside the silhouette a plane paints the corona: a hot ring at the limb, a
wide halo, and a slow streamer. Stars sit far behind in the same frustum and the
pointer sweeps them against the moon, which is the one cue that says depth
rather than picture. It is the only illustration in the system and the only place
copper is used at scale. On top of it, a static vignette (`radial-gradient`) keeps
the page edges settled so text stays on a calm field.

Under the canvas, the body carries one static layer: a half-tone dither of 1px
dots at 3% alpha, the film-grain tooth of the reference. No image request.
Everything above is either paper or surface.

The scene is skipped when `prefers-reduced-motion: reduce` is set or the visitor
turns motion off: it then paints a single static frame (a still eclipse), so the
picture never disappears — only the movement does. If WebGL is unavailable, a
CSS-only still eclipse stands in (`.still-eclipse`), so the page never depends on
the canvas to look finished. The stand-in sits above the canvas in paint order, so
once the shader has proved it painted, `scene.js` both fades it out with a CSS
transition and takes it out of the picture with `display: none` — a background tab
never advances a transition, and a stand-in that lingers would cover the scene.
The stand-in is built from the same tokens, anchored at the same two points, so
the handover does not move the moon.

Placement. On wide screens the moon has the right column: its diameter is 0.30 of
the viewport height, its centre at 77.5% across and 44% down. Phones have no such
column, so it shrinks to 0.165 and moves into the gap beside the headline — 87.5%
across, 22.5% down — clear of the eyebrow above it and the lede below. The blend
between the two is a smoothstep on the viewport aspect (0.70 → 1.05), so nothing
snaps at a breakpoint. `probe-fit.mjs` mirrors those numbers and checks that the
disc never reaches a line of text.

The camera is aimed by translating it the other way rather than by rotating: a
sphere projects to a circle from any viewpoint, so the centre lands exactly where
the layout asked and the silhouette stays round at every aspect.

Themes. One implementation, two readings. At night the ring's hot line is chalk
(`--scene-core`), the halo is copper, and the stars are out. On paper the ring is
the deepest copper instead — a chalk ring on cream disappears — the wide falloff
is held back (`mix(1.0, 0.5, uDay)` on the halo), the stars are dropped as grit,
and the key light steps back so the body reads as a dark disc and not a brown
stain. The corona's hottest line is set by scroll, so the chapters below are never
lit by a bright thing behind the words.

Blending. The corona writes premultiplied colour (`vec4(colour * alpha, alpha)`)
under normal blending rather than additive: additive over cream is neither
predictable nor printable, and a premultiplied result can be audited against the
page in both themes.

Layer order, bottom to top: the dither ground (body background), the canvas
(`.scene`, z-index 1, `pointer-events: none`, `aria-hidden`), the still eclipse
(inside `.scene`), the page content (z-index 3), the chapter rail (z-index 40), the
header (z-index 50).

Cost: three.js is vendored as two minified files (`three.module.min.js` +
`three.core.min.js`, ~751 KB raw, ~187 KB gzip) and only the home page imports it.
That is a lot of bytes for one sphere behind a headline; the scene is built and
disposed once, the texture is made in a canvas at boot, and no image is fetched,
but if the weight ever matters more than the convenience this is the first file to
question.

## Motion

- The moon drifts on a slow clock — a breath, plus a slow spin — and the pointer
  sweeps the star field against it, which is the parallax that sells the depth.
  The stars only move; the moon keeps its mark on the page, so the fit and the
  contrast stay where the layout put them.
- Scroll progress fades the corona and draws the moon back a hair as the page is
  read (from 0.40 to 0.92 of the way down), so no chapter below is lit by a
  bright thing behind the words.
- Chapters: `#opening` and `#contact` pin for one viewport of scroll; the work
  and about chapters keep their label column sticky while the body scrolls. The
  pin is `calc(100svh - var(--header-h) - 1px)`, because the sticky header is in
  flow above it: the first screen is the header plus the pin, exactly one viewport.
- The scroll cue closes the hero rather than floating over it. A fixed cue would
  sit on top of whatever else is on screen at short heights, and on a phone the
  hero is taller than the screen by design, so there it is simply not shown.
- Reveals: staggered translate/fade per element, once, on first intersection. They
  are opt-in behind `html.js`, and a safety net shows anything already in the
  viewport if the observer is late or never fires — content must not be able to
  stay invisible.
- Hover: links fill their underline, buttons step up 1px, cards lift their
  border to `line-strong`.

Every one of these stops under `prefers-reduced-motion: reduce`, and the header
motion control turns them off on request (stored in localStorage). Scroll
progress, focus, and hover feedback are not motion and stay.

## Accent discipline

Copper is the light source. It appears at:

- the eclipse in the canvas,
- the chapter index (the mono numeral that opens each chapter),
- the scroll progress line under the header,
- the primary button and the LIVE plate,
- link hover underlines, selection, and the focus ring.

Nowhere else. Links at rest are ink with a `line-strong` underline; body copy is
never copper. This is broader than the previous "inversion block only" rule and
is the reason it is written down.

## Identity motif

The chapter index: a two-digit mono numeral in copper, followed by a hairline and
the chapter name in mono, opening every chapter on the home page. It replaces the
previous filled index plate. One per chapter, nowhere else.

The chapter rail (wide screens only) repeats those names down the right gutter and
marks the current one with `aria-current` plus a longer copper rule, so the state
never rests on colour alone. The moon's halo reaches into that gutter as the page
is read, so each label carries its own field — a soft paper plate with a backdrop
blur, the same idiom as the header veil. A bare label in the penumbra is the one
place the scene could still cost legibility; with its own field the rail measures
5.37 or better. That plate is a deliberate trade: it is visible over the dark disc
in the day theme, and legibility wins.

## Content structure

- Opening: the display statement, the role line, one lede paragraph, two
  actions, and the real facts panel (base, work, availability, other profiles).
- 01 Work: GitHub repos sorted by stars as ruled rows; the top row is the
  featured block with its real screenshot and a LIVE plate when a demo exists.
- 02 About: two paragraphs beside the photo, three real stats, then Experience
  and Certifications as one records band.
- 03 Contact: the closing band with the display title, the availability
  sentence, and the actions.
- Reading pages: the blog list and the article page share the tokens, the header,
  and the footer, and nothing else — no chapters, no canvas.

## Deliberate departures from the reference

Recorded so they are decisions, not accidents:

1. Two themes. The reference is dark only; this site keeps its light theme and
   the toggle, so both are designed and measured (see Palette).
2. No loading screen. The reference gates the page behind a progress overlay
   while WebGL boots. Since the canvas here is a local file and the page is
   readable without it, a progress bar would be theatre. The scene fades in when
   it is ready instead.
3. Type: our own display face (Space Grotesk) and our own mono (IBM Plex Mono),
   but body copy stays IBM Plex Sans rather than the display face.
4. The eclipse is our own build, not a port of the reference's scene. We borrowed
   the technique — a displaced sphere under real lights — because a flat painted
   disc reads as a picture rather than an object; their camera waypoints, their
   instrument rings and their post-processing chain are all absent, and the moon,
   its material, the lights, the corona and the stars are our own numbers.

## Scope

index.html (chapter frame), blog.html, post.html, 404.html, the article template
in tools/build.mjs, assets/css/style.css, assets/js/site.js, the project row
renderer in assets/js/main.js, plus assets/js/scene.js and assets/js/journey.js
(new, home page only) and the vendored three.js in assets/vendor/three. The admin
CMS is untouched.
