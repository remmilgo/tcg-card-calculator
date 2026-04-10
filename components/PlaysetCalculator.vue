<template>
  <div>
    <h1>Cyberpunk TCG Playset Probability Calculator</h1>
    <p class="intro">Monte Carlo simulation — how many <strong>boxes</strong> you need to open to complete a full <strong>playset</strong> (multiple copies of every card) at a given confidence level.</p>

    <!-- ─── Global settings ─────────────────────────────────────────── -->
    <section class="card">
      <h2>Global Settings</h2>
      <div class="settings-grid">
        <div class="field">
          <label>Packs per Box</label>
          <input v-model.number="packsPerBox" type="number" min="1" max="500" />
        </div>
        <div class="field">
          <label>Confidence Level (%)</label>
          <input v-model.number="confidence" type="number" min="51" max="99" />
        </div>
        <div class="field">
          <label>Default Copies / Card</label>
          <input v-model.number="defaultCopies" type="number" min="1" max="20" @change="applyDefaultCopies" />
        </div>
        <div class="field">
          <label>Simulations</label>
          <input v-model.number="numSims" type="number" min="1000" max="500000" step="5000" />
        </div>
      </div>
    </section>

    <!-- ─── Rarity tier table ───────────────────────────────────────── -->
    <section class="card">
      <h2>Rarity Tiers</h2>
      <p class="hint" style="margin-bottom:1rem">
        <em>Cards / Pack</em> is the average per pack. Fractions supported — 0.25 = one card every 4 packs.
        Uncheck a tier to exclude it from the calculation.
      </p>
      <div class="table-wrap">
        <table class="tier-table">
          <thead>
            <tr>
              <th>On</th>
              <th>Rarity</th>
              <th>Pool</th>
              <th>Cards / pack</th>
              <th>Copies</th>
              <th>Total</th>
              <th>P(card / pack)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in tiers" :key="i">
              <td><input v-model="t.on" type="checkbox" /></td>
              <td>
                <span class="rbadge">
                  <span class="rarity-dot" :style="{ background: t.color }"></span>
                  {{ t.name }}
                </span>
              </td>
              <td><input v-model.number="t.poolSize" type="number" min="1" class="num-sm" /></td>
              <td><input v-model.number="t.rate" type="number" min="0.0001" step="any" class="num-sm" /></td>
              <td><input v-model.number="t.copies" type="number" min="1" class="num-sm" /></td>
              <td>{{ t.poolSize * t.copies }}</td>
              <td>{{ formatProb(t.rate / t.poolSize) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ─── Run button ──────────────────────────────────────────────── -->
    <button class="calc-btn" :disabled="!canRun || isRunning" @click="runSimulation">
      {{ isRunning ? 'Running…' : 'Run Simulation' }}
    </button>

    <div v-if="status" class="computing">{{ status }}</div>
    <div v-if="isRunning" class="pbar-wrap">
      <div class="pbar" :style="{ width: progressPct + '%' }"></div>
    </div>

    <!-- ─── Results ─────────────────────────────────────────────────── -->
    <template v-if="results">
      <section class="card">
        <h2>Results at {{ confidence }}% Confidence</h2>
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-val" style="color:#34d399">{{ overallBoxes.toLocaleString() }}</div>
            <div class="stat-lbl">Boxes (at {{ confidence }}% Conf)</div>
            <div class="stat-sub">{{ packsPerBox }} packs per box</div>
          </div>
          <div class="stat">
            <div class="stat-val" style="color:#818cf8">{{ avgBoxes }}</div>
            <div class="stat-lbl">Average Boxes</div>
            <div class="stat-sub">Mean packs: {{ Math.round(results.overall.mean).toLocaleString() }}</div>
          </div>
          <div class="stat">
            <div class="stat-val" style="color:#fb923c">{{ Math.round(results.overall.mean).toLocaleString() }}</div>
            <div class="stat-lbl">Expected Packs (Mean)</div>
            <div class="stat-sub">median: {{ pct(results.overall.sorted, 0.5).toLocaleString() }}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Per-Rarity Breakdown</h2>
        <div class="table-wrap">
          <table class="tier-table">
            <thead>
              <tr>
                <th>Rarity</th>
                <th>Pool</th>
                <th>Cards/Pack</th>
                <th>P(card/pack)</th>
                <th>E[packs / 1 card]</th>
                <th>Packs @ {{ confidence }}%</th>
                <th>Boxes @ {{ confidence }}%</th>
                <th>Mean packs</th>
                <th>Std dev</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in tierResultRows" :key="i" :class="{ bottleneck: row.isBottleneck }">
                <td>
                  <span class="rbadge">
                    <span class="rarity-dot" :style="{ background: row.color }"></span>
                    {{ row.name }}
                    <span v-if="row.isBottleneck" class="btag">BOTTLENECK</span>
                  </span>
                </td>
                <td>{{ row.poolSize }}</td>
                <td>{{ formatRateFrac(row.rate) }}</td>
                <td>{{ formatProb(row.pPerPack) }}</td>
                <td>{{ Math.round(row.eSingle).toLocaleString() }}</td>
                <td><strong>{{ row.confPacks.toLocaleString() }}</strong></td>
                <td><strong>{{ row.confBoxes.toLocaleString() }}</strong></td>
                <td>{{ Math.round(row.meanPacks).toLocaleString() }}</td>
                <td>±{{ Math.round(row.stddev).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card chart-card">
        <h2>Cumulative Distribution — Packs to Complete</h2>
        <p class="hint" style="margin-bottom:1rem">
          Each curve shows P(tier complete within N packs). White = overall. Dashed line = confidence threshold.
        </p>
        <div class="chart-wrap">
          <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        </div>
      </section>

      <section class="card">
        <h2>Math &amp; Methodology</h2>

        <details open>
          <summary>Methodology</summary>
          <div class="dcontent">
            <p>This calculator uses <strong>Monte Carlo simulation</strong> — it runs {{ results.numSims.toLocaleString() }} independent pack-opening trials and measures when every enabled rarity tier reaches its required copy count for every card in its pool.</p>
            <p><strong>Each trial:</strong></p>
            <ol>
              <li>Start with an empty collection.</li>
              <li>Open packs one by one. Each pack draws the configured average number of cards per rarity. Fractional rates are resolved probabilistically — a rate of 0.25 means a 25% chance of drawing one card of that rarity from that pack.</li>
              <li>Cards within a rarity are drawn <em>uniformly at random</em> from the pool (equal probability for each unique card).</li>
              <li>Once a card reaches its copy threshold, further pulls of that card are discarded (they do not contribute to a different card).</li>
              <li>Stop when every enabled rarity has the required copies of every card. Record the pack count.</li>
            </ol>
            <p>After sorting all {{ results.numSims.toLocaleString() }} results, the <strong>{{ confidence }}th percentile</strong> gives the pack count at which {{ confidence }}% of players will have completed the playset.</p>
          </div>
        </details>

        <details>
          <summary>Per-Rarity Calculations</summary>
          <div class="dcontent">
            <div v-for="(row, i) in tierResultRows" :key="i" style="margin-bottom:1.25rem">
              <div class="rbadge" style="margin-bottom:.5rem;font-weight:700">
                <span class="rarity-dot" :style="{ background: row.color }"></span>
                {{ row.name }}
              </div>
<pre class="mblock">Pool size       : {{ row.poolSize }} unique cards
Cards / pack    : {{ formatRateFrac(row.rate) }} (average)
Copies needed   : {{ row.copies }} per card  →  {{ row.poolSize * row.copies }} total

P(specific card per pack) = {{ formatRateFrac(row.rate) }} ÷ {{ row.poolSize }} = {{ formatProb(row.pPerPack) }}

Single card — NegBin(K={{ row.copies }}, p={{ row.pPerPack.toPrecision(6) }})
  E[packs]   = K / p  =  {{ row.copies }} / {{ row.pPerPack.toPrecision(6) }}
             ≈ {{ Math.round(row.eSingle).toLocaleString() }} packs
  Std Dev    = √(K(1−p)) / p  ≈  ±{{ Math.round(row.sdSingle).toLocaleString() }} packs

Tier completion ({{ confidence }}th pct, simulation) : {{ row.confPacks.toLocaleString() }} packs
Tier mean (simulation)                        : {{ Math.round(row.meanPacks).toLocaleString() }} packs  ±{{ Math.round(row.stddev).toLocaleString() }}</pre>
            </div>
          </div>
        </details>

        <details>
          <summary>Combined Result &amp; Bottleneck</summary>
          <div class="dcontent">
            <p>The playset requires completing <em>all</em> tiers. Completion time = <strong>maximum</strong> across tier completion times.</p>
            <p>Since each rarity occupies its own pack slot, tier completion times are approximately independent. The combined CDF is therefore the product of individual CDFs:</p>
<pre class="mblock">P(done by N packs)
  = P(all tiers done by N)
  ≈ {{ tierResultRows.map(r => 'P(' + r.name + ' done by N)').join(' × ') }}</pre>
            <p>The bottleneck is <strong>{{ bottleneckRow?.name }}</strong> — the tier with the highest completion time at the {{ confidence }}th percentile, which dominates the overall answer.</p>
<pre class="mblock">Overall {{ confidence }}th percentile : {{ overallPacks.toLocaleString() }} packs
Boxes needed             : ⌈{{ overallPacks }} ÷ {{ packsPerBox }}⌉ = {{ overallBoxes }}</pre>
            <p class="hint" style="font-size:.82rem">The simulation produces the true joint distribution directly; the product formula above is shown for conceptual transparency and is a very close approximation when tier draws are independent.</p>
          </div>
        </details>

        <details>
          <summary>Single-Card Distribution Reference</summary>
          <div class="dcontent">
            <p>For one specific card with probability <code>p</code> per pack and a target of <code>K</code> copies, the number of packs follows a <strong>Negative Binomial</strong> distribution:</p>
<pre class="mblock">E[packs]   = K / p
Var[packs] = K · (1 − p) / p²
Std Dev    = √(K · (1 − p)) / p</pre>
            <p>Completing the <em>entire pool</em> of M unique cards with K copies each is the <strong>Coupon Collector problem with K copies</strong> (double dixie cup problem). No simple closed form exists for arbitrary M and K — hence the simulation approach.</p>
            <p>Per-card reference for this set:</p>
<pre class="mblock">{{ singleCardReference }}</pre>
          </div>
        </details>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ─── Settings ────────────────────────────────────────────────────────────────
const packsPerBox   = ref(24)
const confidence    = ref(90)
const defaultCopies = ref(3)
const numSims       = ref(50000)

// ─── Tiers (matches the source page defaults) ────────────────────────────────
const tiers = ref([
  { name: 'Common',   color: '#9ca3af', poolSize: 60, rate: 7,        copies: 3, on: true  },
  { name: 'Uncommon', color: '#34d399', poolSize: 32, rate: 3,        copies: 3, on: true  },
  { name: 'Rare',     color: '#60a5fa', poolSize: 32, rate: 1.5,      copies: 3, on: true  },
  { name: 'Epic',     color: '#c084fc', poolSize: 12, rate: 0.25,     copies: 3, on: true  },
  { name: 'Secret',   color: '#fbbf24', poolSize: 4,  rate: 1 / 24,   copies: 3, on: true  },
  { name: 'Alt Art',  color: '#fb7185', poolSize: 31, rate: 1 / 18,   copies: 1, on: false },
])

function applyDefaultCopies() {
  tiers.value.forEach(t => { t.copies = defaultCopies.value })
}

// ─── Run state ───────────────────────────────────────────────────────────────
const isRunning  = ref(false)
const progress   = ref(0)
const status     = ref('')
const results    = ref(null) // { overall, perTier, tiers, conf, ppb, numSims }

const progressPct = computed(() => Math.round((progress.value / numSims.value) * 100))

const canRun = computed(() => tiers.value.some(t => t.on && t.poolSize > 0 && t.rate > 0 && t.copies > 0))

// ─── Worker source (kept as a string so we can ship it as a Blob worker) ────
const WORKER_SRC = `
self.onmessage = function(msg) {
  var tiers = msg.data.tiers;
  var numSims = msg.data.numSims;
  var nT = tiers.length;
  var overall = new Array(numSims);
  var perTier = tiers.map(function() { return new Array(numSims); });

  for (var s = 0; s < numSims; s++) {
    var states = tiers.map(function(t) {
      return { counts: new Uint8Array(t.poolSize), complete: 0, done: false };
    });
    var packs = 0;
    var doneCnt = 0;

    while (doneCnt < nT) {
      packs++;
      for (var i = 0; i < nT; i++) {
        var st = states[i];
        if (st.done) continue;
        var t = tiers[i];
        var frac = t.rate - (t.rate | 0);
        var draws = (t.rate | 0) + (frac > 0 && Math.random() < frac ? 1 : 0);
        var cnt = st.counts;
        var M = t.poolSize;
        var K = t.copies;
        var cmp = st.complete;
        for (var d = 0; d < draws; d++) {
          var card = (Math.random() * M) | 0;
          var c = cnt[card];
          if (c < K) {
            cnt[card] = c + 1;
            if (c + 1 === K) cmp++;
          }
        }
        st.complete = cmp;
        if (cmp >= M) {
          st.done = true;
          perTier[i][s] = packs;
          doneCnt++;
        }
      }
    }
    overall[s] = packs;

    if ((s & 1023) === 1023) {
      self.postMessage({ type: 'progress', done: s + 1 });
    }
  }

  function computeStats(arr) {
    arr.sort(function(a,b){ return a-b; });
    var n = arr.length;
    var sum = 0;
    for (var i = 0; i < n; i++) sum += arr[i];
    var mean = sum / n;
    var varSum = 0;
    for (var i = 0; i < n; i++) { var d = arr[i] - mean; varSum += d*d; }
    return { mean: mean, stddev: Math.sqrt(varSum / n), sorted: arr };
  }

  self.postMessage({
    type: 'result',
    overall: computeStats(overall),
    perTier: perTier.map(computeStats)
  });
};
`

let activeWorker = null

onBeforeUnmount(() => {
  if (activeWorker) { activeWorker.terminate(); activeWorker = null }
})

function runSimulation() {
  const active = tiers.value.filter(t => t.on && t.poolSize > 0 && t.rate > 0 && t.copies > 0)
  if (active.length === 0) return

  const N    = Math.max(1000, Math.min(500000, numSims.value || 50000))
  const conf = Math.max(0.51, Math.min(0.99, (confidence.value || 90) / 100))
  const ppb  = Math.max(1, packsPerBox.value || 24)

  const tiersData = active.map(t => ({
    name: t.name,
    color: t.color,
    poolSize: Math.round(t.poolSize),
    rate: t.rate,
    copies: Math.round(t.copies),
  }))

  isRunning.value = true
  progress.value  = 0
  status.value    = `Running ${N.toLocaleString()} simulations…`
  results.value   = null

  if (activeWorker) activeWorker.terminate()

  const blob = new Blob([WORKER_SRC], { type: 'text/javascript' })
  const worker = new Worker(URL.createObjectURL(blob))
  activeWorker = worker

  worker.onmessage = (e) => {
    if (e.data.type === 'progress') {
      progress.value = e.data.done
      status.value = `Running… ${e.data.done.toLocaleString()} / ${N.toLocaleString()}`
    } else if (e.data.type === 'result') {
      progress.value = N
      status.value = `Done — ${N.toLocaleString()} simulations completed.`
      results.value = {
        overall: e.data.overall,
        perTier: e.data.perTier,
        tiers: tiersData,
        conf,
        ppb,
        numSims: N,
      }
      isRunning.value = false
      worker.terminate()
      if (activeWorker === worker) activeWorker = null
    }
  }

  worker.postMessage({ tiers: tiersData, numSims: N })
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function pct(sorted, p) {
  const idx = Math.ceil(p * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

function formatProb(p) {
  if (p >= 0.001) return (100 * p).toFixed(4) + '%'
  return (100 * p).toFixed(6) + '%'
}

function formatRateFrac(r) {
  if (r >= 1) return r % 1 === 0 ? String(r) : r.toFixed(2).replace(/\.?0+$/, '')
  const inv = 1 / r
  const rounded = Math.round(inv)
  if (Math.abs(inv - rounded) < 0.5) return '1/' + rounded
  return r.toFixed(4).replace(/\.?0+$/, '')
}

// ─── Derived display ────────────────────────────────────────────────────────
const overallPacks = computed(() => results.value ? pct(results.value.overall.sorted, results.value.conf) : 0)
const overallBoxes = computed(() => results.value ? Math.ceil(overallPacks.value / results.value.ppb) : 0)
const avgBoxes     = computed(() => results.value ? (results.value.overall.mean / results.value.ppb).toFixed(1) : '0')

const tierResultRows = computed(() => {
  if (!results.value) return []
  const { tiers: ts, perTier, conf, ppb } = results.value

  // Find bottleneck
  let bottleneckIdx = 0
  let bottleneckVal = 0
  perTier.forEach((s, i) => {
    const v = pct(s.sorted, conf)
    if (v > bottleneckVal) { bottleneckVal = v; bottleneckIdx = i }
  })

  return ts.map((tier, i) => {
    const s         = perTier[i]
    const confPacks = pct(s.sorted, conf)
    const confBoxes = Math.ceil(confPacks / ppb)
    const pPerPack  = tier.rate / tier.poolSize
    const eSingle   = tier.copies / pPerPack
    const sdSingle  = Math.sqrt(tier.copies * (1 - pPerPack)) / pPerPack
    return {
      name: tier.name,
      color: tier.color,
      poolSize: tier.poolSize,
      rate: tier.rate,
      copies: tier.copies,
      pPerPack,
      eSingle,
      sdSingle,
      confPacks,
      confBoxes,
      meanPacks: s.mean,
      stddev: s.stddev,
      isBottleneck: i === bottleneckIdx,
    }
  })
})

const bottleneckRow = computed(() => tierResultRows.value.find(r => r.isBottleneck))

const singleCardReference = computed(() => {
  return tierResultRows.value.map(r => {
    const name  = r.name.padEnd(10)
    const pStr  = formatProb(r.pPerPack).padStart(12)
    const eStr  = String(Math.round(r.eSingle)).padStart(7)
    return `${name}  p = ${pStr}  E = ${eStr} packs  σ = ±${Math.round(r.sdSingle)}`
  }).join('\n')
})

// ─── Chart ───────────────────────────────────────────────────────────────────
const CHART_SAMPLES = 200

function buildCdfPoints(sorted, maxX) {
  const n = sorted.length
  const pts = []
  for (let i = 0; i <= CHART_SAMPLES; i++) {
    const x = (maxX * i) / CHART_SAMPLES
    // upper-bound binary search: count of sorted[j] <= x
    let lo = 0, hi = n
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sorted[mid] <= x) lo = mid + 1
      else hi = mid
    }
    pts.push({ x, y: lo / n })
  }
  return pts
}

const chartData = computed(() => {
  if (!results.value) return null
  const { overall, perTier, tiers: ts, conf } = results.value
  const maxX = pct(overall.sorted, 0.99) * 1.08

  const datasets = []
  ts.forEach((t, i) => {
    datasets.push({
      label: t.name,
      data: buildCdfPoints(perTier[i].sorted, maxX),
      borderColor: t.color,
      backgroundColor: t.color + '20',
      borderWidth: 1.8,
      pointRadius: 0,
      tension: 0,
      fill: false,
    })
  })
  datasets.push({
    label: 'Overall',
    data: buildCdfPoints(overall.sorted, maxX),
    borderColor: '#ffffff',
    backgroundColor: '#ffffff20',
    borderWidth: 2.5,
    pointRadius: 0,
    tension: 0,
    fill: false,
  })
  // Confidence threshold (dashed horizontal line)
  datasets.push({
    label: `${Math.round(conf * 100)}% threshold`,
    data: [{ x: 0, y: conf }, { x: maxX, y: conf }],
    borderColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderDash: [5, 5],
    pointRadius: 0,
    fill: false,
  })

  return { datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false, axis: 'x' },
  plugins: {
    legend: {
      labels: { color: '#ccc', font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        title: (items) => `${Math.round(items[0].parsed.x).toLocaleString()} packs`,
        label: (item) => ` ${item.dataset.label}: ${(item.parsed.y * 100).toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      type: 'linear',
      ticks: {
        color: '#aaa',
        callback: (v) => Math.round(v).toLocaleString(),
        maxTicksLimit: 8,
      },
      grid: { color: '#283548' },
      title: { display: true, text: 'Packs Opened', color: '#aaa' },
    },
    y: {
      type: 'linear',
      min: 0,
      max: 1,
      ticks: {
        color: '#aaa',
        callback: (v) => Math.round(v * 100) + '%',
      },
      grid: { color: '#283548' },
      title: { display: true, text: 'Cumulative Probability', color: '#aaa' },
    },
  },
}))
</script>

<style>
/* ─── Settings grid ─────────────────────────────────────────────────────── */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .settings-grid { grid-template-columns: 1fr 1fr; }
}

.field label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}

.field input[type="number"] {
  width: 100%;
}

/* ─── Tier table ────────────────────────────────────────────────────────── */
.tier-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tier-table th {
  text-align: left;
  color: #777;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.4rem 0.6rem 0.55rem;
  border-bottom: 1px solid #2a2a35;
  white-space: nowrap;
}

.tier-table td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid #1e1e28;
  color: #ccc;
  white-space: nowrap;
}

.tier-table tbody tr:last-child td { border-bottom: none; }
.tier-table tbody tr:hover td { background: #1e1e28; }

.tier-table td input[type="number"].num-sm {
  width: 80px;
  padding: 0.25rem 0.4rem;
  font-size: 0.82rem;
}

.tier-table td input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #818cf8;
}

tr.bottleneck td { background: rgba(251, 191, 36, 0.07) !important; }

.btag {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: #fbbf24;
  color: #000;
  letter-spacing: 0.04em;
  margin-left: 5px;
  vertical-align: middle;
}

.rbadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

/* ─── Progress bar ──────────────────────────────────────────────────────── */
.pbar-wrap {
  height: 4px;
  background: #283548;
  border-radius: 3px;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.pbar {
  height: 100%;
  background: #818cf8;
  transition: width 0.1s;
}

/* ─── Stat cards ────────────────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
}

.stat {
  background: #14141c;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 1.15rem;
  text-align: center;
}

.stat-val {
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.1;
}

.stat-lbl {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 0.3rem;
}

.stat-sub {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 0.15rem;
}

/* ─── Math details ──────────────────────────────────────────────────────── */
details {
  margin-bottom: 0.6rem;
}

details summary {
  cursor: pointer;
  padding: 0.55rem 0.75rem;
  border-radius: 7px;
  font-size: 0.875rem;
  color: #94a3b8;
  user-select: none;
  list-style: none;
}

details summary::-webkit-details-marker { display: none; }

details summary::before {
  content: '▶ ';
  font-size: 0.7rem;
  margin-right: 0.25rem;
}

details[open] summary::before { content: '▼ '; }

details summary:hover {
  background: #14141c;
  color: #e0e0e8;
}

.dcontent {
  padding: 0.75rem 0.75rem 0.5rem;
  font-size: 0.85rem;
  line-height: 1.75;
  color: #aaa;
}

.dcontent p + p { margin-top: 0.6rem; }
.dcontent ol, .dcontent ul { margin-left: 1.4rem; }
.dcontent strong { color: #ddd; }
.dcontent em { color: #c4b5fd; font-style: italic; }
.dcontent code {
  background: #14141c;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: 0.85em;
  color: #c4b5fd;
}

.mblock {
  background: #0f0f13;
  border-left: 3px solid #818cf8;
  padding: 0.75rem 1rem;
  border-radius: 0 6px 6px 0;
  margin: 0.75rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  line-height: 1.7;
  color: #c4b5fd;
  white-space: pre;
  overflow-x: auto;
}
</style>
