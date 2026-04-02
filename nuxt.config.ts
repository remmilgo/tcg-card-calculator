import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,
  app: {
    head: {
      title: 'TCG Pack Calculator',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
    // hash-based routing works under file:// (no server needed for navigation)
    router: { options: { hashMode: true } },
  },
  vite: {
    plugins: [viteSingleFile()],
    build: { cssCodeSplit: false },
  },
})
