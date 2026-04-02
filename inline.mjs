// Builds card-calc.html by embedding Vue 3 + Chart.js into the app template.
// Edit card-calc.template.html to change the app, then run: node inline.mjs

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

function ensureLib(path, url) {
  if (!existsSync(path)) {
    console.log(`Downloading ${url}…`)
    execSync(`curl -sL "${url}" -o "${path}"`)
  }
}

ensureLib('/tmp/vue3.min.js',    'https://unpkg.com/vue@3/dist/vue.global.prod.js')
ensureLib('/tmp/chartjs.min.js', 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js')

const template = readFileSync('card-calc.template.html', 'utf8')
const vue      = readFileSync('/tmp/vue3.min.js',   'utf8')
const chart    = readFileSync('/tmp/chartjs.min.js', 'utf8')

const out = template
  .replace('VUEJS_PLACEHOLDER', vue)
  .replace('CHARTJS_PLACEHOLDER', chart)

writeFileSync('card-calc.html', out)
console.log(`✓ card-calc.html  ${Math.round(out.length / 1024)} KB`)
