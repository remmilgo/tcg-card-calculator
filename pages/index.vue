<template>
  <div class="app">
    <nav class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-sub">{{ tab.sub }}</span>
      </button>
    </nav>

    <LandingPage v-if="activeTab === 'home'" @navigate="activeTab = $event" />
    <PackCalculator v-else-if="activeTab === 'pack'" />
    <PlaysetCalculator v-else-if="activeTab === 'playset'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LandingPage from '~/components/LandingPage.vue'
import PackCalculator from '~/components/PackCalculator.vue'
import PlaysetCalculator from '~/components/PlaysetCalculator.vue'

const tabs = [
  { id: 'home',    label: 'Home',               sub: 'overview' },
  { id: 'pack',    label: 'Pack Calculator',    sub: 'distinct cards collected' },
  { id: 'playset', label: 'Playset Calculator', sub: 'boxes for a full playset' },
]

const activeTab = ref('home')
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0f0f13;
  color: #e0e0e0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 15px;
  min-height: 100vh;
}

.app {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Tabs ───────────────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #2a2a35;
  padding-bottom: 0;
  margin-bottom: 0.5rem;
}

.tab {
  flex: 1;
  background: transparent;
  border: 1px solid #2a2a35;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  color: #888;
  padding: 0.85rem 1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  text-align: left;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  position: relative;
  top: 1px;
}

.tab:hover:not(.active) {
  background: #181822;
  color: #ccc;
}

.tab.active {
  background: #1a1a22;
  color: #fff;
  border-color: #2a2a35;
  box-shadow: 0 -2px 0 0 #5b8dee inset;
}

.tab-label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.tab-sub {
  font-size: 0.72rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.tab.active .tab-sub { color: #5b8dee; }

@media (max-width: 520px) {
  .tab-sub { display: none; }
  .tab { flex-direction: row; align-items: center; }
}

/* ─── Shared component styles (used by both tabs) ────────────────────────── */
h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
}

.card {
  background: #1a1a22;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card:last-child { margin-bottom: 0; }

.row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.row label {
  min-width: 200px;
  color: #ccc;
}

input[type="number"],
input[type="text"] {
  background: #0f0f13;
  border: 1px solid #333;
  color: #fff;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.95rem;
  width: 120px;
  outline: none;
  transition: border-color 0.15s;
}

input[type="number"]:focus,
input[type="text"]:focus {
  border-color: #5b8dee;
}

input[type="number"]:disabled,
input[type="text"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider {
  flex: 1;
  accent-color: #5b8dee;
  height: 4px;
  cursor: pointer;
}

.color-input {
  width: 48px !important;
  height: 36px;
  padding: 2px;
  cursor: pointer;
  border-radius: 6px;
}

/* Rarity grid */
.rarity-grid {
  display: grid;
  grid-template-columns: 160px 140px 140px 60px;
  gap: 0.5rem;
  align-items: center;
}

.rarity-header {
  font-size: 0.8rem;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #2a2a35;
}

.rarity-grid input[type="text"] { width: 100%; }
.rarity-grid input[type="number"] { width: 100%; }

.auto-value {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #5b8dee;
}

.auto-tag {
  font-size: 0.7rem;
  background: #5b8dee22;
  color: #5b8dee;
  border-radius: 4px;
  padding: 1px 5px;
  text-transform: uppercase;
}

.warning {
  margin-top: 0.75rem;
  color: #e74c3c;
  font-size: 0.9rem;
}

/* Pack summary */
.pack-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.pack-chip {
  border: 1px solid;
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.intro {
  color: #999;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.hint {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.6;
}

.hint strong {
  color: #999;
}

.muted { color: #777; }
.small { font-size: 0.85rem; margin-top: 0.5rem; }

/* Calc button */
.calc-btn {
  align-self: flex-start;
  background: #5b8dee;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  margin-bottom: 1.5rem;
}

.calc-btn:hover:not(:disabled) { background: #4a7de0; }
.calc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.computing {
  color: #aaa;
  font-style: italic;
  margin-bottom: 1.5rem;
}

/* Rarity visibility toggles */
.rarity-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.rarity-toggle {
  border: 1px solid;
  border-radius: 20px;
  padding: 0.2rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s, color 0.12s;
  letter-spacing: 0.02em;
}

/* Chart */
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-wrap {
  position: relative;
  height: 400px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #555;
}

/* Metrics table */
.table-wrap {
  overflow-x: auto;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.metrics-table th {
  text-align: left;
  color: #777;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.4rem 0.75rem 0.5rem;
  border-bottom: 1px solid #2a2a35;
  white-space: nowrap;
}

.metrics-table td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid #1e1e28;
  color: #ccc;
}

.metrics-table tbody tr:last-child td { border-bottom: none; }

.metrics-table tbody tr:hover td { background: #1e1e28; }

.col-complete {
  font-weight: 600;
  color: #fff !important;
}

.rarity-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
