---
title: "WordPress"
summary: "An academic publishing platform on Qur'anic studies, six years in production on WordPress. Built to be editable by its authors long after handover."
date: 2026-10-29
language: WordPress
tags: ["wordpress", "woocommerce", "performance"]
draft: false
---

The problem was not getting this site online. It was keeping it useful for the people who publish on it long after the build was done.

A launch screenshot proves a site can look finished. studitafsir.com is judged by whether it stayed stable after plugin updates, theme changes, hosting migrations, and years of unsupervised edits.

| Site | Function | Stack | First byte | Page weight |
|---|---|---|---|---|
| [studitafsir.com](https://studitafsir.com/) | Academic publishing platform on Qur'anic studies, multiple authors | WordPress | 0.50 s | 85 KB |

First byte and page weight measured on 29 October 2026 from Indonesia, uncached.

## Scope of work

- Theme and plugin selection, kept to a minimum from the first commit
- Caching and image handling, to hold each page under 200 KB
- A content model the owners can extend without breaking the layout
- WordPress core, plugin, and PHP updates after launch
- Fixing breakage caused by updates

## Constraints

The budget was small. The visual result reflects that, and I would approach the build differently today.

The trade was deliberate: a maintained site that still publishes is worth more to its owners than one that photographs well and is left to decay.

## Result

Six years in production without a rebuild. `studitafsir.com` published new material in September 2026, six years after launch.

## What I would do differently

- Cap the plugin count from week one, not year three
- Hand over a written update and backup schedule, so the site does not depend on one person's memory
- Charge for maintenance from the start; it ran unprotected for years because that was the arrangement I offered
