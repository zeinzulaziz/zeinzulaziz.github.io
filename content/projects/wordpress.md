---
title: "WordPress sites in production"
summary: "Three WordPress and WooCommerce sites built between 2019 and 2021 for a florist, a battery retailer, and an academic publishing platform. All three are still serving traffic in 2026."
date: 2026-10-29
language: WordPress
tags: ["wordpress", "woocommerce", "performance"]
draft: false
---

Portfolio entries typically show a screenshot from launch day: the moment a site looks its best and proves the least.

What outlasts the launch is whether a site still runs years later — after plugin updates, after a theme stops being maintained, after a hosting migration, after an owner has spent years editing content unsupervised.

All three below are still running in 2026.

| Site | Function | Stack | First byte | Page weight |
|---|---|---|---|---|
| [cikhaflorist.com](https://cikhaflorist.com/) | Florist in Nganjuk: catalogue, categories, WhatsApp ordering | WordPress, WooCommerce, Astra, Elementor, LiteSpeed Cache | 0.18 s | 181 KB |
| [akimobiljombang.com](https://akimobiljombang.com/) | Car and motorcycle battery retailer with 24-hour call-out | WordPress, WooCommerce, Astra, Elementor, SpeedyCache | 0.18 s | 179 KB |
| [studitafsir.com](https://studitafsir.com/) | Academic publishing platform on Qur'anic studies, multiple authors | WordPress | 0.50 s | 85 KB |

Measured 29 October 2026, first uncached request from Indonesia.

## Scope of work

- Theme and plugin selection, kept to a minimum from the first commit
- Caching and image handling, to hold each page under 200 KB
- A content model the owner can extend without breaking the layout
- WordPress core, plugin, and PHP updates after launch
- Fault correction as updates broke things

## Constraints

Two of the three were built on a limited budget, using the owner's own photography and copy. The visual result reflects those inputs, and I would approach all three differently today.

The trade was deliberate: a maintained site that still converts is worth more to its owner than one that photographs well and is left to decay.

## Result

Five to seven years in production without a rebuild. `studitafsir.com` published new material in September 2026, six years after launch.

## What I would do differently

- Cap the plugin count from week one, not year three
- Hand over a written update and backup schedule, so the site does not depend on one person's memory
- Charge for maintenance from the start — these three ran unprotected for years because that was the arrangement I offered
