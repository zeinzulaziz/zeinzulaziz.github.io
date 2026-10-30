---
title: "Convert Gold"
summary: "A gold price calculator that turns USD per troy ounce into rupiah per gram, with entry, target, and stop-loss levels."
repo: convert-gold
demo: https://zeinzulaziz.github.io/convert-gold/
language: HTML
cover: assets/img/convert-gold.webp
tags: ["calculator", "gold"]
draft: false
---

Convert Gold starts from the gold price in USD per troy ounce and the USD/IDR rate, then shows what one gram costs in rupiah. It also lines up the per-gram prices published by Antam, UBS, and Pegadaian, so the gap between spot and retail is visible.

A trader mode adds position planning: entry price, target, stop loss, and the capital you are working with, entered in grams. It shows profit and loss per gram, potential profit for the position, and the risk/reward ratio.

Prices come from a live gold spot feed and the ECB reference rate for USD/IDR, refreshed every few minutes. The whole calculator is one static page.
