---
title: "WordPress sites, still live"
summary: "Three production WordPress sites built between 2019 and 2021 — a florist, a battery shop, and an academic publishing platform. All three are still online in 2026."
date: 2026-10-29
language: WordPress
tags: ["wordpress", "woocommerce", "performance"]
draft: false
---

Most portfolios show a screenshot taken the day the site launched. That screenshot
proves nothing, because every site looks good on launch day. The only question that
matters is the one nobody asks in the case study: **is it still there?**

These three still are.

| Site | What it does | Runs on | First byte | Page weight |
|---|---|---|---|---|
| [cikhaflorist.com](https://cikhaflorist.com/) | Florist in Nganjuk: catalogue, categories, WhatsApp ordering | WordPress, WooCommerce, Astra, Elementor, LiteSpeed Cache | 0.18 s | 181 KB |
| [akimobiljombang.com](https://akimobiljombang.com/) | Car and motorcycle battery shop, 24-hour call-out | WordPress, WooCommerce, Astra, Elementor, SpeedyCache | 0.18 s | 179 KB |
| [studitafsir.com](https://studitafsir.com/) | Academic publishing platform on Qur'anic studies, multiple authors | WordPress | 0.50 s | 85 KB |

Numbers measured 29 October 2026, first uncached request from Indonesia.

## Why longevity is the interesting part

A site that survives five to seven years in production has cleared every obstacle a
demo never meets: the client who stops paying attention, the plugin that breaks after
an update, the theme that gets abandoned, the hosting that moves twice, the one
section the owner edits badly at 11 p.m. and then calls about.

Surviving that is not a design skill. It is a decision made at build time about how
much the site depends on things that will change.

## What I actually did

- Built the site, chose the theme and the plugin set, and kept the set small
- Set up caching and image handling so the pages stay under 200 KB
- Structured content so the owner can add their own products and articles without
  breaking the layout
- Kept the WordPress core, plugins, and PHP current after launch
- Fixed the things that broke

## What they are not

They are not beautiful. Two of them were built under a tight budget with the owner's
own photos and the owner's own copy, and it shows. I would design all three
differently today.

That is the honest trade: a site that looks like a portfolio piece sits on a shelf.
A site that looks ordinary and is still taking orders six years later has done its
job. **studitafsir.com is still publishing new articles in 2026** — six years after
build — which is the outcome I would rather be judged on.

## What I would do differently

- Cap plugin count from week one, not year three
- Put the analytics and the backup schedule in writing at handover, so the site does
  not depend on one person remembering
- Charge for maintenance from the start — these three ran unprotected for years
  because that was the deal I offered
