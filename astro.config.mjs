// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// TODO: set this to the live domain once deployed (enables canonical + OG URLs).
const SITE = "https://liambirch.co.za";

export default defineConfig({
  site: SITE,
  trailingSlash: "never",
  // ~8 KB gzipped: inlining it removes the render-blocking CSS request.
  build: { inlineStylesheets: "always" },
  vite: {
    plugins: [tailwindcss()],
  },
});
