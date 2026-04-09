# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run generate   # Generate static site (used for GitHub Pages deployment)
npm run preview    # Preview production build
```

No test infrastructure exists in this project.

## Architecture

**Stack:** Vue 3 (Composition API) + Nuxt 3 + Chart.js/vue-chartjs. SSR is disabled (`ssr: false`) — this is a static SPA generated with `nuxt generate` and deployed to GitHub Pages.

**Base URL:** `nuxt.config.ts` sets `baseURL` to `/tcg-card-calculator/` when running in GitHub Actions, `/` otherwise.

**All application logic lives in a single file: `pages/index.vue`** (~540 lines). There is no routing beyond this one page. `app.vue` is just a `<NuxtPage />` passthrough.

### pages/index.vue structure

- **State:** Vue `ref`/`computed` only — no Pinia, no Vuex. Key refs: `totalCards`, `rarities[]`, `certainty`, `maxPacks`, `chartData`.
- **Core math:** `simulate(R, k, packs, certaintyFraction)` — uses the coupon collector expected value formula `E = R * (1 - q^n)` with a normal distribution quantile correction (`normalQuantile(p)` via Wichura's polynomial approximation) to model how many distinct cards are collected at a given confidence level.
- **Chart:** Registers Chart.js components manually; renders a dual-dataset line chart per rarity (solid = expected collected, dashed = target).
- **Rarity config:** `rarities` array holds per-rarity settings (name, count, per-pack rate, color). `commonCount` is auto-derived from `totalCards` minus the sum of all other rarities.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml` (runs `npx nuxt generate`, uploads `dist/`).
