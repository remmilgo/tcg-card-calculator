<template>
  <div>
    <h1>Cyberpunk TCG Probability Tools</h1>
    <p class="intro">Two complementary calculators for the <strong>Welcome to Night City</strong> set — one for collectors chasing one of every card, one for playset builders chasing multiple copies of every card.</p>

    <section class="card hero">
      <div class="hero-badge">Pick a calculator</div>
      <h2 class="hero-title">Two questions, two models</h2>
      <p class="hero-text">
        Both tools take the same kind of input — set size, rarity tiers, average cards per pack — but they answer fundamentally different questions about pack-opening luck.
      </p>
      <p class="hero-text">
        Use the <strong>Pack Calculator</strong> if you want to know roughly how far a stack of packs will get you toward a one-of-each binder. Use the <strong>Playset Calculator</strong> if you actually want to play the game and need three copies of every card to build decks.
      </p>
    </section>

    <section class="card">
      <h2>The two calculators</h2>
      <div class="picker-grid">
        <button class="picker" @click="$emit('navigate', 'pack')">
          <div class="picker-head">
            <span class="picker-tag tag-pack">Tab 2</span>
            <h3>Pack Calculator</h3>
          </div>
          <p class="picker-q">How many distinct cards will I have after N packs?</p>
          <ul class="picker-bullets">
            <li>Target: <strong>1 of each</strong> card</li>
            <li>Closed-form coupon-collector with normal-quantile correction</li>
            <li>Line chart of distinct cards collected vs. packs opened</li>
            <li>Milestone table: packs to 25 / 50 / 75 / 100% complete per rarity</li>
          </ul>
          <div class="picker-cta">Open Pack Calculator →</div>
        </button>

        <button class="picker" @click="$emit('navigate', 'playset')">
          <div class="picker-head">
            <span class="picker-tag tag-playset">Tab 3</span>
            <h3>Playset Calculator</h3>
          </div>
          <p class="picker-q">How many boxes do I need to complete a full playset?</p>
          <ul class="picker-bullets">
            <li>Target: <strong>K copies</strong> of every card (configurable)</li>
            <li>Monte Carlo simulation — up to 500,000 trials in a Web Worker</li>
            <li>CDF chart per tier with confidence threshold line</li>
            <li>Bottleneck callout: which rarity dominates your completion time</li>
          </ul>
          <div class="picker-cta">Open Playset Calculator →</div>
        </button>
      </div>
    </section>

    <section class="card">
      <h2>How to use them together</h2>
      <ol class="howto">
        <li>
          <strong>Start with the Pack Calculator</strong> if you're just trying to budget a few boxes for a casual collection. The chart tells you the marginal return of opening more — and where the curves flatten out (i.e. when chasing the last few cards stops being efficient).
        </li>
        <li>
          <strong>Move to the Playset Calculator</strong> when you need real numbers for a playset. Set your tolerance with the confidence slider (90% means 9 out of 10 players reach the target by that pack count). The bottleneck row tells you which rarity is actually keeping you from finishing.
        </li>
        <li>
          <strong>Compare results.</strong> Both tools default to the same rarity distribution, so the "Packs to complete" column in the Pack Calculator should roughly match the "Packs @ conf%" column in the Playset Calculator when you set <em>Copies / Card = 1</em>.
        </li>
      </ol>
    </section>

    <section class="card">
      <h2>About the data</h2>
      <p class="hint">
        Both calculators are pre-loaded with the <strong>Welcome to Night City</strong> set: 171 total cards across 6 rarities (60 Commons, 32 Uncommons, 32 Rares, 12 Epic Rares, 4 Secret Rares, 31 Iconic Rares). Every input is editable, so you can model any set or any house-rule configuration.
      </p>
      <p class="hint" style="margin-top:.75rem">
        The Monte Carlo simulation runs entirely client-side in a Web Worker — nothing is uploaded.
      </p>
    </section>
  </div>
</template>

<script setup>
defineEmits(['navigate'])
</script>

<style>
.hero {
  background: linear-gradient(135deg, #1a1a22 0%, #1f1f2e 100%);
  border-color: #3b3b55;
}

.hero-badge {
  display: inline-block;
  background: #5b8dee22;
  color: #5b8dee;
  border: 1px solid #5b8dee55;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.85rem;
}

.hero-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.85rem;
  text-transform: none;
  letter-spacing: -0.01em;
}

.hero-text {
  color: #b8b8c5;
  font-size: 0.95rem;
  line-height: 1.65;
  margin-bottom: 0.7rem;
}

.hero-text:last-child { margin-bottom: 0; }
.hero-text strong { color: #f1f5f9; }

/* ─── Picker cards ──────────────────────────────────────────────────────── */
.picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .picker-grid { grid-template-columns: 1fr; }
}

.picker {
  background: #14141c;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}

.picker:hover {
  border-color: #5b8dee;
  background: #181826;
  transform: translateY(-1px);
}

.picker-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.picker-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.01em;
}

.picker-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.12rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-pack {
  background: #5b8dee22;
  color: #5b8dee;
  border: 1px solid #5b8dee44;
}

.tag-playset {
  background: #818cf822;
  color: #a5b4fc;
  border: 1px solid #818cf844;
}

.picker-q {
  font-size: 0.92rem;
  color: #ddd;
  font-style: italic;
  line-height: 1.45;
}

.picker-bullets {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.picker-bullets li {
  color: #888;
  font-size: 0.83rem;
  line-height: 1.5;
  padding-left: 0.9rem;
  position: relative;
}

.picker-bullets li::before {
  content: '›';
  position: absolute;
  left: 0;
  color: #5b8dee;
  font-weight: 700;
}

.picker-bullets li strong { color: #ccc; }

.picker-cta {
  margin-top: auto;
  padding-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #5b8dee;
  letter-spacing: 0.01em;
}

.picker:hover .picker-cta { color: #7ba4f0; }

/* ─── How-to list ───────────────────────────────────────────────────────── */
.howto {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  counter-reset: howto;
}

.howto li {
  position: relative;
  padding-left: 2.4rem;
  color: #999;
  font-size: 0.9rem;
  line-height: 1.6;
  counter-increment: howto;
}

.howto li::before {
  content: counter(howto);
  position: absolute;
  left: 0;
  top: 0;
  width: 1.7rem;
  height: 1.7rem;
  background: #5b8dee22;
  color: #5b8dee;
  border: 1px solid #5b8dee44;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.howto li strong { color: #ddd; }
.howto li em { color: #c4b5fd; font-style: italic; }

.hint a {
  color: #818cf8;
  text-decoration: none;
  border-bottom: 1px dashed #818cf855;
}

.hint a:hover {
  color: #a5b4fc;
  border-bottom-color: #a5b4fc;
}
</style>
