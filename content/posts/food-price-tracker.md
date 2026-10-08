---
title: 'Helping East Java Farmers Know When to Sell: Building a Food Price Tracker'
slug: food-price-tracker
date: 2026-10-08
type: article
description: A free, open tool that turns historical producer price data into practical guidance for farmers in East Java.
tags:
  - blog
draft: false
---

Farmers rarely control the price they receive for their harvest. But they can often control _when_ they sell. Food prices move in patterns throughout the year, and a farmer who knows which months usually bring higher prices can make a better decision about timing.

That idea is behind [Harga Pangan](https://harga-pangan.built.my.id/), a website I'm building with Claude to make food price data in East Java easier to read and use.

## The problem

East Java's provincial government already publishes producer price data through SISKAPERBAPO. The data is valuable, but raw tables are hard to interpret, especially on a phone and especially for someone who just wants to answer a simple question: _is now a good time to sell?_

## What the website does

The site has two main parts.

**Charts.** Users can pick a commodity and a market, then view price trends over different periods, from one week up to all available history. Producer prices are shown per kilogram in rupiah.

**Analysis.** This is the core of the project. Using historical data, the Analysis tab summarizes for each commodity:

- the months when prices have typically been highest, which is the best time to sell,
- the months when prices have typically been lowest,
- whether prices are currently gaining momentum,
- how consistent the seasonal pattern has been over the years,
- how much of the data is actual versus estimated.

The consistency measure matters. A pattern that repeats every year is far more useful than one that appeared only once, and the site tries to make that difference visible.

## Data and transparency

The data comes from SISKAPERBAPO Jawa Timur and is refreshed automatically every day through GitHub Actions. When the source has not yet published a value for a given day, the site fills the gap with the previous day's price and clearly marks it as an estimate (dashed lines and an "Estimasi" label), so users are never misled about what is real data.

## Why I'm building it

This is a social project, not a commercial one. The goal is simple: give farmers, especially in East Java, a clearer picture of price seasonality so they can plan planting and selling with more information.

## Limitations

The analysis is based on historical patterns. It does not guarantee future prices, which can be affected by weather, supply disruptions, policy changes, and many other factors. It should be treated as one input for decision-making, not a promise.

## What's next

The project is still under development. Feedback from farmers, extension workers, and anyone familiar with local agricultural markets is very welcome, since they know best what is actually useful on the ground.

You can try the site here: [harga-pangan.built.my.id](https://harga-pangan.built.my.id/)
