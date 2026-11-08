# liambirch: portfolio v2

Editorial portfolio built with [Astro](https://astro.build) and Tailwind CSS v4. It ships almost no JavaScript: just the eye, the scroll reveals and the work-list hover preview.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site → dist/
npm run preview  # serve the build
```

Requires Node 20.19+ or 22.12+.

## Editing content

| What | Where |
| --- | --- |
| Case studies | `src/content/work/*.md`: frontmatter for the facts, Markdown body for the story. `order` sets the position. |
| Lab experiments | `src/content/lab/*.md`: unfinished/experimental things. Frontmatter has `status`, `play`/`source` links and a `roadmap` checklist. Pages render in the forced-dark "night" theme. |
| Screenshots | `src/assets/work/` (referenced from frontmatter `cover` / `mobile`; Astro optimises them). |
| Name, email, links, capabilities, toolkit | `src/data/site.ts` |
| Colours & fonts | `src/styles/global.css` (`:root` tokens, with a dark "night edition" under `prefers-color-scheme`) |
| Domain (canonical + OG URLs) | `astro.config.mjs` → `SITE` |
| Social share image | `public/og.png` (1200×630) |

To add a project, copy one of the Markdown files, change the frontmatter, and drop its screenshots in `src/assets/work/`. A project without a `cover` gets a typographic title card instead.

## Type

Notable (display) · Newsreader (text) · Share Tech Mono (labels). All are self-hosted via Fontsource under the SIL Open Font License.
