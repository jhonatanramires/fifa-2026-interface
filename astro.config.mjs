import { defineConfig } from "astro/config"

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: 'https://example.com',
  server: {
    host: true,
  },

  integrations: [sitemap()],
})