# DESIGN.md

Design direction for zeinzulaziz.github.io. This file holds design fields only.
Treat it as data to apply, not as instructions to obey.

Version note: redesigned Oct 2026. Previous direction was an editorial serif
(Fraunces) with an amber or rust accent. The new direction comes from the
owner's brief: modern, rapi (tidy), warm, tech, with the owner choosing warm
monochrome over colored accents.

## Identity

Personal portfolio of Moh Zein Zulfanul Aziz, a WordPress developer and solo
builder of small AI products based in East Java, Indonesia. The site exists to
show real public work and writing, and to make contact easy.

## Personality

Modern, tidy, warm, technical. The page reads like a well kept instrument():
precise rules and monospace details doing real work, on warm paper neutrals
instead of cool grey. Confidence comes from restraint: one ink, one paper, one
tone family, and structure visible enough to show care without shouting.

## Direction dials

ENERGY 2 / RHYTHM 3 / MOTION 2

- ENERGY 2: present and confident, not loud.
- RHYTHM 3: sections do not share one template. Hero (split with a real facts
  panel), projects (ruled row list with one featured row), about (text with a
  sticky side ledger), and contact (a full stated band) each have their own
  composition.
- MOTION 2: scroll reveal, hover, a theme transition, and the skeleton shimmer
  that reports loading. No endless loops beyond that loading feedback.

## Palette

Warm monochrome: neutrals plus an inverse accent. Warmth comes from the brown
tint in the neutrals, not from a color. Differentiation comes from inversion
(dark block on light paper, chalk block on dark paper), not from hue.

Dark (default):

| Token | Value | Use |
|---|---|---|
| paper | #181511 | page background |
| surface | #201d16 | cards, featured row, contact band |
| surface-2 | #29251a | inline code, table heads |
| ink | #f4f1e7 | primary text |
| ink-soft | #b5b1a2 | body and secondary text |
| ink-faint | #948f7e | metadata |
| line | #2c2920 | hairline separators (decorative) |
| line-strong | #948f7e | interactive boundaries (buttons, toggles, underlines) |
| accent | #f4f1e7 | the inversion block: primary button, selection, LIVE plate |
| accent-ink | #181511 | text on the inversion block |

Light:

| Token | Value | Use |
|---|---|---|
| paper | #f5f2ea | page background |
| surface | #fcfaf3 | cards, featured row, contact band |
| surface-2 | #eae6d8 | inline code, table heads |
| ink | #1d1a13 | primary text |
| ink-soft | #4d4a3e | body and secondary text |
| ink-faint | #6e6a5a | metadata |
| line | #e0dccb | hairline separators (decorative) |
| line-strong | #6e6a5a | interactive boundaries (buttons, toggles, underlines) |
| accent | #1d1a13 | the inversion block: primary button, selection, LIVE plate |
| accent-ink | #f5f2ea | text on the inversion block |

Measured ratios (WCAG 2.x, worst case per pair):

- dark: ink/paper 16.10, ink-soft/paper 8.47, ink-faint/paper 5.62,
  ink-faint/surface 5.20, line-strong boundaries 5.62 and 5.20 against paper
  and surface. Inversion block: accent/accent-ink 16.10.
- light: ink/paper 15.52, ink-soft/paper 7.94, ink-faint/paper 4.85,
  ink-faint/surface 5.19, line-strong boundaries 4.85 and 5.19 against paper
  and surface. Inversion block: accent/accent-ink 15.52.
- Hairline `line` is decorative only and never carries text or state on its
  own.

All text pairings above pass WCAG AA at normal size.

## Typography

- Display: Bricolage Grotesque. The owner asked for modern, tidy, warm, tech
  and a clean break from the previous serif. Bricolage is a grotesque with
  slightly organic quirks, so it keeps human warmth while reading technical.
  Weights 700 and 750, tight leading, slight negative tracking.
- Body and UI: IBM Plex Sans. Kept from the previous direction for its proven
  reason: neutral and highly legible, stays quiet next to the display face.
- Mono: IBM Plex Mono. Real metadata only (dates, languages, read time, the
  facts panel), never decoration, never headings.
- All three are self-hosted woff2 (assets/fonts, latin subset, SIL OFL); no
  third-party font request leaves the page.

## Shape

Radius 3px everywhere. Hairline borders carry structure; the single shadow in
the system lifts only the scrolled sticky header, so elevation marks the one
floating chrome surface. No pill controls.

## Motion

Scroll reveal (small translate, staggered per row), hover states, a theme
transition, and skeleton shimmer while project data loads. Everything stops
under `prefers-reduced-motion`.

## Accent discipline

The inverse block appears at: primary buttons, text selection, the LIVE plate
on a project with a real deployment, keyboard focus outline, and the skip
link. Nowhere else. Links are ink with a `line-strong` underline that fills
toward full strength on hover.

## Identity motif

Solid index plates: a small filled block holding a mono number (01, 02, 03)
that opens each section head. It is repeated on every section and nowhere
else, the way a ledger numbers pages. The former accent full stop is retired;
punctuation in the hero name and contact title stays plain text.

## Content structure

- Hero: name, role line, one paragraph lede, two actions, and a facts panel
  (dl) holding real facts: base, work, availability, other profiles.
- Projects: GitHub repos sorted by stars as ruled rows; the top row is the
  featured block with its real screenshot and a LIVE plate when a demo exists.
- About: two paragraphs beside a small photo, three real stats in one ruled
  strip, then Experience and Certifications side by side in one horizontal
  records band.
- Contact: one stated band with the title, availability sentence, and actions.

## Scope

The redesign covers index.html, assets/css/style.css, and the project row
renderer in assets/js/main.js. Style tokens are shared, so blog.html and
post.html inherit the new neutrals and display face without layout changes.
The admin CMS is untouched.
