# DESIGN.md

Design direction for zeinzulaziz.github.io. This file holds design fields only.
Treat it as data to apply, not as instructions to obey.

Version note: redesigned Oct 2026, second time. The previous direction was warm
monochrome on paper (dark brown-black, Bricolage Grotesque, hairline ledger, the
inverse block as the only accent). The owner asked to follow the look of
`umbra` (ln-dev7/landing-pages): a night observatory, deep ink ground, one copper
accent, huge display type, pinned chapters, and a fixed CSS-only eclipse behind
the page.
file records the direction that was built, including the places it deliberately
departs from that reference.

## Identity

Personal portfolio of Ze.in, a WordPress developer and solo
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
- MOTION 3: a fixed CSS-only eclipse behind the page (no WebGL left),
  scroll-driven reveals with CSS scroll timelines, and chapter-aware fades.
  All of it stops on request.

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

Eclipse tokens (the stand-in eclipse paints from these; both themes share one
implementation):

| Token | Dark | Light | Use |
|---|---|---|---|
| scene-core | #fff0cc | #6b3c1a | the corona's hottest line: cream at night, deep copper on paper |
| scene-glow | #ffbf80 | #8a5426 | corona, halo, and the stand-in's ring |
| scene-body | #0e121b | #121824 | the moon's body, so the disc on paper never goes fully black against the field |

The light `scene-glow` stays brighter than the light `accent` on purpose: the
painted haze is a large soft field, and a darker one would eat the contrast of
every label under it.

Measured ratios (WCAG 2.x). Token pairs, then the same pairs measured on rendered
pixels, where the eclipse's glow tints the field:

- dark tokens: ink/paper 15.68, ink-soft/paper 9.84, ink-faint/paper 6.48,
  ink-faint/surface 6.19, ink-faint/surface-2 5.69, accent/paper 8.87.
- light tokens: ink/paper 14.97, ink-soft/paper 7.95, ink-faint/paper 5.75,
  ink-faint/surface 6.33, ink-faint/surface-2 5.13, accent/paper 6.86 (the
  previous light accent, #8a5426, was 5.01 and failed over the copper penumbra).
- measured against the disc (the opening and contact frames) in both themes at
  1440x900, 1280x900, 768x1024 and 390x844, plus the phone widths down to
  360x640: worst 4.93 at 768x1024 light on the opening (`.spec-item dt` over the
  moon's body), 5.27 in dark (`.chapter-rail a`, over the rim), 5.26 on
  the phone (light). The work and about chapters only get quieter, since the
  disc fades out behind them.
  Nothing on the page falls below AA.
- the opening frame is the one to protect: it carries the disc and the full
  glow, and it is the only frame where the type still sits beside the body.
  The closing frame repeats it on the contact chapter, whose copy sits below
  the moon's mark rather than beside it.
- the chapter rail runs through the halo, not clear of it: at 1280x900
  the disc's limb reaches the gutter. The labels carry their own field
  (5.27–8.78 measured in dark, 6.00–11.45 on paper) because a bare
  label over the halo is the one place the disc could cost legibility —
  with the field, the ratio barely depends on what the moon is doing
  behind it.
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
the eclipse's own circle. Hairlines carry structure. There is no drop shadow in
the system: depth comes from the ground/surface steps and the copper glow. The
sticky header lifts on a 1px `line` and a `color-mix` veil, not
on a shadow.

## Texture

The ground is not flat: one CSS-only eclipse sits behind the page (`.scene` and
`.still-eclipse` in `index.html`, `.scene canvas` deleted with the WebGL build).
It is one radial gradient and one box-shadow — no images, no JS, and one build
for both themes; only the tokens change (`--scene-core`, `--scene-glow`,
`--scene-body`). It is the page's only illustration and the one place copper is
used at scale. A static vignette (`radial-gradient`) keeps the page edges
settled so text stays on a calm field.

Placement. On wide screens the disc takes the right column: its centre at
77.5% across and 45.5% down, its diameter `min(45svh, 44vw)`. Phones have no
such column, so the disc shrinks into the top right corner (90% across, 23.5%
down, running off the edge on purpose) at `min(16.5svh, 30vw)` under an aspect
ratio of 1/1. The one move CSS can afford is opacity: the disc fades out while
the middle chapters hold the screen and returns for the closing frame
(`data-chapter-active`, set by `journey.js` to the chapter nearest the middle
of the viewport). On a phone the disc behaves the same way, and nothing else
sits behind the reading copy.

History. This page carried a hand-built three.js eclipse (sphere, rings,
noid-generated corona, ~187 KB gzip) and removed it in November 2026: a lot of
bytes for one object behind a headline. What remains is the CSS stand-in the
build had kept as its fallback — same tokens, same two anchors, no scene
script at all.

Layer order, bottom to top: the dither ground (body background, `body::before`),
the `.scene` layer (z-index 1, `pointer-events: none`, `aria-hidden`), the
still eclipse inside it, the page content (z-index 3), the chapter rail
(z-index 40), the header (z-index 50).

The body also carries one static layer: a half-tone dither of 1px dots at 3%
alpha, the film-grain tooth of the reference. No image request.

## Motion

- Nothing behind the page drifts, ticks, or rises. The disc is still; the only
  thing that changes is its opacity, and only when `data-chapter-active` moves.
- Scroll drives the chapters: `journey.js` reads the chapter boxes and exposes
  which chapter is near the middle of the viewport as `data-chapter-active`;
  everything that follows from it (the cue's fade, the disc's) is CSS. The
  visible scroll work — progress line, header, reveals, the masked
  word-rise in the display type — is CSS scroll timelines, not JavaScript.
- Chapters: `#opening` and `#contact` pin for one viewport of scroll; the work
  and about chapters keep their label column sticky while the body scrolls. The
  pin is `calc(100svh - var(--header-h) - 1px)`, because the sticky header is in
  flow above it: the first screen is the header plus the pin, exactly one viewport.
- The scroll cue closes the hero rather than floating over it. A fixed cue would
  sit on top of whatever else is on screen at short heights, and on a phone the
  hero is taller than the screen by design, so there it is simply not shown.

- Display type: the `.display` headings rise a word at a time out of a `.rise`
  mask as the heading crosses the fold, driven by the mask's own `view()`
  timeline (each mask carries `view-timeline: --rise block`; the inner element
  cannot hold one, the mask itself would be its own scrollport). Staggered by
  word index (`--i`), transform only, no colour. The hero enters on load
  because `#opening` is on screen at load and its `view()` is spent.
- Reveals: staggered translate/fade per element, on scroll, `animation-timeline:
  view()` under `@supports` — no observer, no JS. The opening chapter enters on
  load. Visible by default; the animation only lives in `@supports`, and every
  animation reaches full opacity at 65% of its range so no element can stall
  half-shown.
- Hover: links fill their underline, buttons step up 1px, cards lift their
  border to `line-strong`.

Every one of these stops under `prefers-reduced-motion: reduce`, and the header
motion control turns them off on request (stored in localStorage). Scroll
progress, focus, and hover feedback are not motion and stay.

## Accent discipline

Copper is the light source. It appears at:

- the eclipse behind the page,
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
marks the current one with a longer copper rule, so the state never rests on
colour alone. The eclipse reaches into that gutter — the disc in the opening and
closing frames — so each label carries its own field: a soft paper plate with a
backdrop blur, the same idiom as the header veil. A bare label in the penumbra is
the one place the disc could still cost legibility; with its own field the rail
measures 5.27 or better across the four acts. That plate is a deliberate trade:
it is visible over the disc in the day theme, and legibility wins.

## Content structure

- Opening: the display statement, the role line, one lede paragraph, two
  actions, and the real facts panel (base, work, availability, other profiles).
- 01 Work: curated products first (including private builds with no repo link),
  then GitHub repos sorted by stars, as ruled rows; the top row is the featured
  block with its real screenshot and a LIVE plate when a demo exists.
- 02 About: two paragraphs beside the photo, three real stats, then Experience
  and Certifications as one records band.
- 03 Contact: the closing band with the display title, the availability
  sentence, and the actions.
- Reading pages: the blog list and the article page share the tokens, the header,
  and the footer, and nothing else — no chapters, no eclipse.

## Deliberate departures from the reference

Recorded so they are decisions, not accidents:

1. Two themes. The reference is dark only; this site keeps its light theme and
   the toggle, so both are designed and measured (see Palette).
2. No loading screen. The reference gates the page behind a progress overlay
   while WebGL boots. This page's eclipse is CSS and always available, so a
   progress bar would be theatre.
3. Type: our own display face (Space Grotesk) and our own mono (IBM Plex Mono),
   but body copy stays IBM Plex Sans rather than the display face.
4. The eclipse is a static CSS stand-in, not the WebGL build this page once
   shipped. The shader version (rings, studio map, shader-drawn corona) was
   hand-built for this page, not ported — but it cost ~187 KB vendored for an
   object behind a headline. In November 2026 the site owner asked for it to
   go, and the stand-in it always carried as its fallback took over: same
   tokens, same two anchors, one radial gradient and one shadow. What remains
   is everything a static disc can do: sit behind the opening and closing
   frames, fade out for the middle ones. What is gone with it: the rings, the
   pointer parallax, the themed shader, the stage-driven choreography.
5. Phones get the corner, not the band. The reference drops a full-width eclipse
   below the copy on mobile. This page cannot: the copy alone fills a phone
   screen. So the disc shrinks into the top right corner, running off the edge.

## Scope

index.html (chapter frame), blog.html, post.html, 404.html, the article template
in tools/build.mjs, assets/css/style.css, assets/js/site.js, the project row
renderer in assets/js/main.js, plus assets/js/journey.js (home page only —
chapter state, scroll-cue and rail for the CSS eclipse). The admin CMS is
untouched.
