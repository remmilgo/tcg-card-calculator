<template>
  <div class="app">
    <h1>Cyberpunk TCG Pack Calculator</h1>
    <p class="intro">Pre-loaded with the <strong>Welcome to Night City</strong> set (171 cards, 6 rarities). Adjust any value if you want to model a different configuration. The chart shows how many distinct cards of each rarity you're likely to have collected after opening X packs, at your chosen confidence level.</p>

    <!-- Set Configuration -->
    <section class="card">
      <h2>Set Configuration</h2>
      <div class="row">
        <label>Total cards in set</label>
        <input v-model.number="totalCards" type="number" min="1" @change="onTotalChange" />
      </div>
      <p class="hint">Welcome to Night City: 171 total (60 Commons, 32 Uncommons, 32 Rares, 12 Epic Rares, 4 Secret Rares, 31 Iconic Rares).</p>
      <div class="row" style="margin-top:1rem">
        <label>Number of rarity levels</label>
        <input v-model.number="rarityCount" type="number" min="1" max="10" @change="onRarityCountChange" />
      </div>
      <p class="hint">Each tier gets its own line on the chart. Changing this resets the rarity table to generic defaults.</p>
    </section>

    <!-- Rarities -->
    <section class="card" v-if="rarities.length">
      <h2>Rarity Levels</h2>
      <p class="hint" style="margin-bottom:1rem">Configure each rarity from rarest (top) to most common (bottom). Commons are auto-calculated as whatever cards are left after the other rarities are accounted for.</p>
      <div class="rarity-grid">
        <div class="rarity-header">Name</div>
        <div class="rarity-header" title="How many distinct cards exist at this rarity in the full set">Cards in set</div>
        <div class="rarity-header" title="How many cards of this rarity you get in a single booster pack">Cards per pack</div>
        <div class="rarity-header">Color</div>

        <template v-for="(r, i) in rarities" :key="i">
          <input v-model="r.name" type="text" :placeholder="`Rarity ${i + 1}`" :disabled="r.isCommon" />
          <div v-if="r.isCommon" class="auto-value">
            {{ commonCount }} <span class="auto-tag">auto</span>
          </div>
          <input v-else v-model.number="r.count" type="number" min="1" @change="clampRarities" />
          <input v-model.number="r.perPack" type="number" min="0" step="any" />
          <input v-model="r.color" type="color" class="color-input" />
        </template>
      </div>
      <div v-if="commonCount < 1" class="warning">
        Rarity card counts exceed total cards — reduce them.
      </div>
      <p class="hint" style="margin-top:1rem"><strong>Cards in set</strong> — how many different cards exist at that rarity.<br /><br /><strong>Cards per pack</strong> — average cards of that rarity per pack. Use decimals for shared slots. In Welcome to Night City each pack has 2 Rare+ slots split across Rare, Epic Rare (1-in-4 packs), Secret Rare (1-in-24), and Iconic Rare (1-in-18) — their per-pack values sum to 2. Commons (7/pack) and Uncommons (3/pack) are guaranteed slots.</p>
    </section>

    <!-- Booster Pack Contents -->
    <section class="card" v-if="rarities.length">
      <h2>Booster Pack Contents</h2>
      <p class="hint" style="margin-bottom:.75rem">This is how a single pack breaks down based on your settings above. A Beta (Kickstarter) display box contains 36 packs; a Retail display box contains 24 packs.</p>
      <div class="pack-summary">
        <span v-for="(r, i) in rarities" :key="i" class="pack-chip" :style="{ background: r.color + '33', borderColor: r.color }">
          {{ r.perPack }}× {{ r.name || `Rarity ${i+1}` }}
        </span>
      </div>
      <div class="row muted">Total cards per pack: {{ totalPerPack }}</div>
    </section>

    <!-- Certainty -->
    <section class="card" v-if="rarities.length">
      <h2>How sure do you want to be?</h2>
      <div class="row">
        <label>Confidence level: <strong>{{ certainty }}%</strong></label>
        <input v-model.number="certainty" type="range" min="50" max="99" step="1" class="slider" />
      </div>
      <p class="hint">This controls how conservative the graph is. At <strong>80%</strong> the graph shows a number of packs where 8 out of 10 players opening that many packs would reach that card count — 2 out of 10 get unlucky and fall short. At <strong>95%</strong> almost everyone makes it, but you'll need significantly more packs. At <strong>50%</strong> it's the average — half of players do better, half do worse.</p>
      <div class="row" style="margin-top:1rem">
        <label>Max packs to show</label>
        <input v-model.number="maxPacks" type="number" min="10" max="2000" step="10" />
      </div>
      <p class="hint">The X-axis range. If the curves haven't flattened by your max, increase this number.</p>
    </section>

    <button class="calc-btn" :disabled="!canCalc" @click="calculate">
      Calculate
    </button>

    <div v-if="computing" class="computing">Computing…</div>

    <!-- Chart -->
    <section class="card chart-card" v-if="simResults">
      <h2>Distinct cards collected per rarity at {{ certainty }}% certainty</h2>

      <div class="rarity-toggles">
        <button
          v-for="(r, i) in rarities"
          :key="i"
          class="rarity-toggle"
          :style="{
            borderColor: r.color,
            color: r.visible ? '#111' : r.color,
            background: r.visible ? r.color : 'transparent',
            opacity: r.visible ? 1 : 0.45,
          }"
          @click="r.visible = !r.visible"
        >{{ r.name || `Rarity ${i + 1}` }}</button>
      </div>

      <div class="chart-wrap">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        <p v-else class="hint chart-empty">All rarities hidden — toggle some above.</p>
      </div>

      <p class="hint" style="margin-top:.75rem">Solid line = distinct cards collected at {{ certainty }}% certainty. Dashed line = full set target for that rarity. Hover for exact values.</p>
    </section>

    <!-- Metrics table -->
    <section class="card" v-if="tableData.length">
      <h2>Completion milestones at {{ certainty }}% certainty</h2>
      <div class="table-wrap">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Rarity</th>
              <th>Cards</th>
              <th>Packs to 25%</th>
              <th>Packs to 50%</th>
              <th>Packs to 75%</th>
              <th>Packs to complete</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.name">
              <td>
                <span class="rarity-dot" :style="{ background: row.color }"></span>
                {{ row.name }}
              </td>
              <td>{{ row.total }}</td>
              <td>{{ row.packs25  ?? `> ${maxPacks}` }}</td>
              <td>{{ row.packs50  ?? `> ${maxPacks}` }}</td>
              <td>{{ row.packs75  ?? `> ${maxPacks}` }}</td>
              <td class="col-complete">{{ row.packs100 ?? `> ${maxPacks}` }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint" style="margin-top:.75rem">Each value is the pack count where the curve crosses that completion threshold at your chosen certainty level. <strong>Packs to complete</strong> is the headline number — the point where you'd expect to have every distinct card at that rarity.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// ─── Chart.js setup ──────────────────────────────────────────────────────────
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ─── State ───────────────────────────────────────────────────────────────────
const totalCards = ref(171)
const rarityCount = ref(6)
const certainty = ref(80)
const maxPacks = ref(500)
const computing = ref(false)
const simResults = ref(null) // populated by calculate(); null means no results yet

const DEFAULT_COLORS = ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#2ecc71', '#e91e63', '#00bcd4', '#ff5722']

function defaultRarityName(i, total) {
  if (i === total - 1) return 'Common'
  const superCount = total - 2 - i
  if (superCount <= 0) return 'Rare'
  return Array(superCount).fill('Super').join(' ') + ' Rare'
}

const rarities = ref([])

// ─── Derived ─────────────────────────────────────────────────────────────────
const commonCount = computed(() => {
  const nonCommon = rarities.value.filter(r => !r.isCommon).reduce((s, r) => s + (r.count || 0), 0)
  return totalCards.value - nonCommon
})

const totalPerPack = computed(() => rarities.value.reduce((s, r) => s + (r.perPack || 0), 0))

const canCalc = computed(() => {
  if (!rarities.value.length) return false
  if (commonCount.value < 1) return false
  if (totalPerPack.value < 1) return false
  return true
})

// Returns the first pack index where data[p] >= target, or null if never reached.
function packsToTarget(data, target) {
  for (let p = 0; p < data.length; p++) {
    if (data[p] >= target) return p
  }
  return null
}

// Rebuilt automatically whenever simResults or any rarity's visible flag changes.
const chartData = computed(() => {
  if (!simResults.value) return null
  const { P, results } = simResults.value
  const labels = Array.from({ length: P + 1 }, (_, i) => i)
  const datasets = []

  results.forEach(({ rarity, R, data }, i) => {
    if (!rarity.visible) return
    const name = rarity.name || `Rarity ${i + 1}`
    datasets.push({
      label: name,
      data,
      borderColor: rarity.color,
      backgroundColor: rarity.color + '20',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    })
    if (R > 0) {
      datasets.push({
        label: `${name} (full: ${R})`,
        data: Array(P + 1).fill(R),
        borderColor: rarity.color,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      })
    }
  })

  return datasets.length ? { labels, datasets } : null
})

const tableData = computed(() => {
  if (!simResults.value) return []
  return simResults.value.results
    .filter(({ rarity }) => rarity.visible)
    .map(({ rarity, R, data }) => ({
      name: rarity.name,
      color: rarity.color,
      total: R,
      packs25:  packsToTarget(data, Math.ceil(R * 0.25)),
      packs50:  packsToTarget(data, Math.ceil(R * 0.50)),
      packs75:  packsToTarget(data, Math.ceil(R * 0.75)),
      packs100: packsToTarget(data, R),
    }))
})

// ─── Initialization ───────────────────────────────────────────────────────────
function buildRarities(count) {
  const existing = rarities.value || []
  const prev = existing.filter(r => !r.isCommon)
  const nonCommonCount = count - 1
  const result = []

  for (let i = 0; i < nonCommonCount; i++) {
    const offset = nonCommonCount - prev.length
    const prevIdx = i - offset
    const p = prevIdx >= 0 ? prev[prevIdx] : null
    result.push({
      name: p?.name ?? defaultRarityName(i, count),
      count: p?.count ?? Math.floor(totalCards.value / (count * 2)),
      perPack: p?.perPack ?? (i === 0 ? 1 : i < nonCommonCount / 2 ? 2 : 4),
      color: p?.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      isCommon: false,
      visible: true,
    })
  }

  const prevCommon = existing.find(r => r.isCommon)
  result.push({
    name: prevCommon?.name ?? 'Common',
    count: 0,
    perPack: prevCommon?.perPack ?? 6,
    color: prevCommon?.color ?? DEFAULT_COLORS[(nonCommonCount) % DEFAULT_COLORS.length],
    isCommon: true,
    visible: true,
  })

  return result
}

function onRarityCountChange() {
  rarities.value = buildRarities(rarityCount.value)
}

function onTotalChange() {
  clampRarities()
}

function clampRarities() {
  const nonCommon = rarities.value.filter(r => !r.isCommon)
  let sum = nonCommon.reduce((s, r) => s + (r.count || 0), 0)
  if (sum >= totalCards.value) {
    const factor = (totalCards.value - nonCommon.length) / sum
    nonCommon.forEach(r => { r.count = Math.max(1, Math.floor(r.count * factor)) })
  }
}

// Welcome to Night City defaults.
// The 2 Rare+ slots per pack are shared: Epic(1/4) + Secret(1/24) + Iconic(1/18) + Rare(remainder).
rarities.value = [
  { name: 'Secret Rare', count: 4,  perPack: 0.042, color: '#f1c40f', isCommon: false, visible: true },
  { name: 'Iconic Rare', count: 31, perPack: 0.056, color: '#e67e22', isCommon: false, visible: true },
  { name: 'Epic Rare',   count: 12, perPack: 0.25,  color: '#9b59b6', isCommon: false, visible: true },
  { name: 'Rare',        count: 32, perPack: 1.652, color: '#3498db', isCommon: false, visible: true },
  { name: 'Uncommon',    count: 32, perPack: 3,     color: '#2ecc71', isCommon: false, visible: true },
  { name: 'Common',      count: 0,  perPack: 7,     color: '#95a5a6', isCommon: true,  visible: true },
]

watch(rarityCount, () => {
  rarities.value = buildRarities(rarityCount.value)
})

// ─── Calculation ──────────────────────────────────────────────────────────────
function simulate(R, k, packs, certaintyFraction) {
  const results = new Array(packs + 1)
  results[0] = 0

  for (let p = 1; p <= packs; p++) {
    const n = p * k
    if (n === 0) { results[p] = 0; continue }
    if (R === 0) { results[p] = 0; continue }

    const q = (R - 1) / R
    const qn = Math.pow(q, n)
    const E = R * (1 - qn)

    const clampedCert = Math.min(certaintyFraction, 0.9999)

    if (certaintyFraction === 0.5) {
      results[p] = Math.round(E)
    } else {
      const q2n = qn * qn
      const r2n = R > 1 ? Math.pow((R - 2) / R, n) : 0
      const varD = R * qn * (1 - qn) + R * (R - 1) * (r2n - q2n)
      const sd = Math.sqrt(Math.max(varD, 0))

      const z = normalQuantile(clampedCert)
      results[p] = Math.max(0, Math.min(R, Math.round(E - z * sd)))
    }
  }
  return results
}

function normalQuantile(p) {
  if (p >= 1) return 8
  if (p <= 0) return -8
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
             0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
             0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  let r, x
  const y = p - 0.5
  if (Math.abs(y) < 0.42) {
    r = y * y
    x = y * (((a[3]*r+a[2])*r+a[1])*r+a[0]) / ((((b[3]*r+b[2])*r+b[1])*r+b[0])*r+1)
  } else {
    r = p < 0.5 ? p : 1 - p
    r = Math.log(-Math.log(r))
    x = c[0]+r*(c[1]+r*(c[2]+r*(c[3]+r*(c[4]+r*(c[5]+r*(c[6]+r*(c[7]+r*c[8])))))))
    if (y < 0) x = -x
  }
  return x
}

async function calculate() {
  if (!canCalc.value) return
  computing.value = true
  simResults.value = null
  await nextTick()
  await new Promise(r => setTimeout(r, 10))

  const cert = certainty.value / 100
  const P = maxPacks.value

  const results = rarities.value.map((r) => {
    const R = r.isCommon ? commonCount.value : r.count
    const data = simulate(R, r.perPack || 0, P, cert)
    return { rarity: r, R, data }
  })

  simResults.value = { P, results }
  computing.value = false
}

// ─── Chart options ────────────────────────────────────────────────────────────
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#ccc', font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        title: (items) => `${items[0].label} packs`,
        label: (item) => ` ${item.dataset.label}: ${item.parsed.y} cards`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#aaa', maxTicksLimit: 20 },
      grid: { color: '#333' },
      title: { display: true, text: 'Packs opened', color: '#aaa' },
    },
    y: {
      ticks: { color: '#aaa' },
      grid: { color: '#333' },
      title: { display: true, text: 'Distinct cards collected', color: '#aaa' },
    },
  },
}))
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
}

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
}

.calc-btn:hover:not(:disabled) { background: #4a7de0; }
.calc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.computing {
  color: #aaa;
  font-style: italic;
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
