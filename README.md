# TCG Pack Calculator

A calculator for trading card game collectors. Configure a card set's rarity levels, pack composition, and desired confidence level, then simulate how many booster packs you need to open to collect a target number of distinct cards per rarity.

Built with Nuxt 3, Vue 3, and Chart.js.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
# Static site (deployed to GitHub Pages)
npm run generate

# Single-file HTML
npm run dist
```

## How the math works

The calculator models how many **distinct** cards you'll collect at each rarity after opening a given number of packs. It's based on the [coupon collector's problem](https://en.wikipedia.org/wiki/Coupon_collector%27s_problem).

### Expected distinct cards

For a rarity with **R** distinct cards where you pull **k** cards of that rarity per pack, after **p** packs you've drawn **n = p × k** individual cards. Each draw is equally likely to be any of the R cards, so the probability of *missing* a specific card every time is:

```
q = (R − 1) / R
```

The expected number of distinct cards collected is:

```
E(n) = R × (1 − qⁿ)
```

This is the 50% confidence line — half of players do better, half do worse.

### Confidence adjustment

To answer "how many distinct cards will I have with X% certainty?", the calculator uses the **variance of the distinct-count distribution**:

```
Var(D) = R × qⁿ × (1 − qⁿ) + R × (R − 1) × (((R − 2)/R)ⁿ − q²ⁿ)
```

It then applies a **normal approximation**: the number of distinct cards after n draws is approximately Normal(E, √Var). The confidence-adjusted estimate is:

```
D = E + z × √Var
```

where **z** is the standard normal quantile for the chosen confidence level (e.g. z ≈ 0.84 for 80%, z ≈ 1.645 for 95%). The quantile is computed using Wichura's rational polynomial approximation.

At 50% confidence z = 0, so you get exactly the expected value. Higher confidence → more packs needed, because you're guarding against bad luck.

### Per-rarity independence

Each rarity is simulated independently. The "cards per pack" value for a rarity can be fractional to model shared slots — for example, if a pack has 2 rare+ slots split across multiple rarities, each rarity gets a fractional share (e.g., Epic Rare at 0.25 per pack means roughly 1 in every 4 packs contains an Epic Rare in that slot).

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the included GitHub Actions workflow.
