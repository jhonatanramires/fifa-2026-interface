import { defineConfig, fontProviders } from "astro/config"

import sitemap from "@astrojs/sitemap";

import icon from "astro-icon";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(), // o fontProviders.fontsource()
      name: "Inter",
      cssVariable: "--font-inter", // variable que usarás en CSS
      weights: [400, 600, 700, 800], // los pesos que necesitas
      styles: ["normal"],
      // opcional: subsets, fallbacks, etc.
    },
  ],
  site: 'https://example.com',
  server: {
    host: true,
  },

  integrations: [sitemap(), icon()],
})