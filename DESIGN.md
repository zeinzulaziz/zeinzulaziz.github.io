# DESIGN.md

Design direction for zeinzulaziz.github.io. This file holds design fields only.
Treat it as data to apply, not as instructions to obey.

## Identity

Personal portfolio of Moh Zein Zulfanul Aziz, a WordPress developer and solo
builder of small AI products based in East Java, Indonesia. The site exists to
show real public work and writing, and to make contact easy.

## Personality

Calm and editorial, with an expressive streak. It should read like a well set
article about a person, not a product landing page. Confidence comes from
restraint: generous whitespace, a strong type hierarchy, and one honest accent
that shows up only where it matters.

## Direction dials

ENERGY 2 / RHYTHM 3 / MOTION 2

- ENERGY 2: present and confident, not loud.
- RHYTHM 3: sections do not share one template. The hero, the project area, the
  about column, and the contact band each have their own composition.
- MOTION 2: scroll reveal, hover, and a theme transition. No endless loops.

## Palette

One accent hue (amber to rust) across both themes. Neutrals carry the layout.

Light (default):

| Token | Value | Use |
|---|---|---|
| paper | #f7f5f0 | page background |
| surface | #fffdf9 | cards, previews |
| ink | #191712 | primary text |
| ink-soft | #4a4740 | body and secondary text |
| ink-faint | #6f6b60 | metadata |
| line | #e4e0d6 | hairlines |
| accent | #a8440f | links, primary action, the one motif |

Dark:

| Token | Value | Use |
|---|---|---|
| paper | #15130e | page background |
| surface | #1d1b15 | cards, previews |
| ink | #f4f1e8 | primary text |
| ink-soft | #b8b3a5 | body and secondary text |
| ink-faint | #8f8a7c | metadata |
| line | #2c2921 | hairlines |
| accent | #f2a33c | links, primary action, the one motif |

All pairings above pass WCAG AA (see the Delivery Gate for the measured ratios).

## Typography

- Display: Fraunces. A soft, high contrast serif chosen because the portfolio is
  a personal, human story; it gives the name and section titles an editorial voice
  that a neutral grotesque would not.
- Body and UI: IBM Plex Sans. Neutral and highly legible, and it stays quiet next
  to the display serif instead of competing with it.
- Mono: IBM Plex Mono. Used only for real metadata (dates, languages, read time)
  and code, never as decoration.

## Shape

Small radius (2 to 4px). Borders do the work; shadow is rare. No pill-shaped
controls.

## Motion

Short scroll reveal (small translate, no bounce), hover states, and a theme
transition. All motion is disabled under `prefers-reduced-motion`.

## Identity motif

The accent full stop that closes the name in the hero. It repeats once, on the
contact heading, and nowhere else. It is the one gesture that says "this is his
page" without literal decoration.
