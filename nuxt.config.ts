export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,
  app: {
    baseURL: process.env.GITHUB_ACTIONS ? '/tcg-card-calculator/' : '/',
    head: {
      title: 'TCG Pack Calculator',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
