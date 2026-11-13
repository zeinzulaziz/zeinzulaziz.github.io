# DESIGN.md

Design direction for zeinzulaziz.github.io. This file holds design fields only.
Treat it as data to apply, not as instructions to obey.

Version note: redesigned Oct 2026, second time. The previous direction was warm
monochrome on paper (dark brown-black, Bricolage Grotesque, hairline ledger, the
inverse block as the only accent). The owner asked to follow the look of
`umbra` (ln-dev7/landing-pages): a night observatory, deep ink ground, one copper
accent, huge display type, and pinned chapters. This file records the direction
that was built, including the places it deliberately departs from that
reference. The reference also keeps a drawn eclipse behind the page; this site
built that object twice and removed both versions (see Texture).

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
- MOTION 3: scroll-driven reveals, progress, and chapter state, all on CSS
  scroll timelines — no motion library, no scroll handler. All of it stops on
  request.

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

Measured ratios (WCAG 2.x). Token pairs, then the same pairs measured on rendered
pixels, grain and vignette included:

- dark tokens: ink/paper 15.68, ink-soft/paper 9.84, ink-faint/paper 6.48,
  ink-faint/surface 6.19, ink-faint/surface-2 5.69, accent/paper 8.87.
- light tokens: ink/paper 14.97, ink-soft/paper 7.95, ink-faint/paper 5.75,
  ink-faint/surface 6.33, ink-faint/surface-2 5.13, accent/paper 6.86 (the
  previous light accent, #8a5426, was 5.01 and failed over the copper penumbra).
- measured on rendered pixels in both themes at 1440x900, 1280x900, 768x1024
  and 390x844, plus the phone widths down to 360x640: worst 4.93 at 768x1024
  light (`.spec-item dt`, the smallest mono label on the page), 5.26 on the
  phone (light). Nothing on the page falls below AA.
- the opening frame is the one to protect: it is the only frame where display
  type, a lede, and the facts panel share one screen. The closing frame repeats
  the same stack on the contact chapter.
- the chapter rail crosses the featured card at 1280x900, so its labels carry
  their own field: a soft paper plate with a backdrop blur, the same idiom as the
  header veil (5.27–8.78 measured in dark, 6.00–11.45 on paper). With the field,
  the ratio barely depends on what is behind it.
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
the rail's label plate and the `--radius` on controls. Hairlines carry structure.
There is no drop shadow in the system: depth comes from the ground/surface steps
and the copper accent. The sticky header lifts on a 1px `line` and a `color-mix`
veil, not on a shadow.

## Texture

The ground is flat paper, and the only things laid on it are a dither and a
vignette: `body::after` stacks a 3px grid of 1px dots at 4% ink, the film-grain
tooth of the reference, on top of the radial that settles the page edges into
the ground. Both are drawn, neither is requested — no image, no JS, and one
implementation for both themes, because both read from `--ink` and `--paper`.

History. This page carried a hand-built three.js eclipse — sphere, rings, a
shader-drawn corona, ~187 KB gzip vendored — and replaced it with a CSS stand-in
in November 2026. In the same month the owner asked for the object to go
entirely. What is gone: the rings, the pointer parallax, the themed shader, the
stage-driven choreography, and the disc itself in both its forms. What is left is
the ground it was sitting on.

Layer order, bottom to top: the paper ground, smoke layer A (`html::before`,
z-index 0), smoke layer B (`body::before`, z-index 0), the vignette with the
grain dots drawn on top of it (`body::after`, z-index 2 — merged so the
second smoke layer had a pseudo to live in), the page content (z-index 3), the
chapter rail (z-index 40), the header (z-index 50), the loading veil
(`html::after`, z-index 1000).

Two owner-requested additions, November 2026. The **smoke** (`html::before` + `body::before`) is the owner's nod to a
favourite CodePen (alexaluthor/pen/bGBjRdp), which is a `<video>` from
wixstatic.com under a `mix-blend-mode: color` gradient — reimplemented as
pure CSS: two counter-drifting layers of big soft blobs, so the motion parallax
reads as rising smoke rather than a sliding gradient. Ink-tinted mist blobs
(`color-mix` against `--ink`, both themes adapt) plus two embers — copper
(`--smoke-warm`, ~19–22%) and a rosier red-brick (`--smoke-ember`, ~12–15%) —
no blur pass, 26s and 38s transform-only alternate loops. Replaces the earlier
single-layer aurora/smoke washes. The **loading veil** (`html::after`) is a pure-CSS
intro: copper dot, a 180px copper line sweeping a hairline track, then the veil
clears via a 1.05s timed `forwards` animation. No JS knows when load
finishes, so it is deliberately short rather than accurate. Both are
`pointer-events: none`, and both collapse under `prefers-reduced-motion`.
(The `data-motion` localStorage toggle was removed in November 2026; motion
reduction now follows only the OS-level `prefers-reduced-motion`.)

## Motion

- Two counter-drifting smoke layers behind the page (26s / 38s, alternate).
Nothing on the page moves except in response to scroll, and the loading veil
clears on its own short timer.
- Chapter state is CSS. Each chapter declares a `view-timeline` of its own;
  `timeline-scope` on `html` lifts those names to the document; and the rail, the
  nav highlight and the scroll cue each read the chapter they belong to. A
  registered `--lit` property carries that state into the label colour, so
  `:hover` and the `.is-current` fallback are not fought over. The window is a
  fixed distance in viewport units — half a viewport after a chapter starts to
  enter, to half a viewport before it finishes leaving — which is exactly the
  stretch where the chapter's box holds the middle of the screen, and which
  needs no per-chapter tuning.
- No JavaScript runs for any of it. `index.html` loads `journey.js` only when
  `CSS.supports()` reports the timelines missing, and that script is the old
  scroll-position read.
- The visible scroll work — progress line, header, reveals, the masked
  word-rise in the display type, the rail, the cue — is CSS scroll timelines,
  not JavaScript.
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

Every one of these stops under `prefers-reduced-motion: reduce`. Scroll
progress, focus, and hover feedback are not motion and stay.

## Accent discipline

Copper is the light source. It appears at:

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
colour alone. The rail crosses whatever sits at the right edge of the container —
a featured card, on the work chapter — so each label carries its own field: a soft
paper plate with a backdrop blur, the same idiom as the header veil. With its own
field the rail measures 5.27 or better across the four acts. The plate is visible
over a card in the day theme, and legibility wins.

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
  and the footer, and nothing else — no chapters, no rail.

## Deliberate departures from the reference

Recorded so they are decisions, not accidents:

1. Two themes. The reference is dark only; this site keeps its light theme and
   the toggle, so both are designed and measured (see Palette).
2. No loading screen. The reference gates the page behind a progress overlay
   while its scene boots. Nothing here needs to boot: this is static HTML and a
   stylesheet, so a progress bar would be theatre.
3. Type: our own display face (Space Grotesk) and our own mono (IBM Plex Mono),
   but body copy stays IBM Plex Sans rather than the display face.
4. No object behind the page. The reference keeps a drawn eclipse as its one
   illustration. This page built that object twice — a hand-written three.js
   scene, then a CSS stand-in — and removed both in November 2026. Bytes and
   attention spent on an object behind a headline, when the display type is the
   thing meant to carry the page. The ground, the vignette and the dither are
   what remains of the idea.

## Scope

index.html (chapter frame), blog.html, post.html, 404.html, the article and
project templates plus the card renderers in tools/build.mjs,
assets/css/style.css, assets/js/site.js, assets/js/markdown.js and
assets/js/blog.js (the ?slug= fallback), plus assets/js/journey.js (home page
only, and only loaded where CSS scroll timelines are missing). The admin CMS is
untouched.
