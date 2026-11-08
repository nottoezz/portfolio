import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      title: z.string(),
      kind: z.string(), // short descriptor shown in the index
      tagline: z.string(), // the editorial one-liner
      summary: z.string(),
      status: z.enum(["Live", "Pre-launch", "Shipped", "Retired"]),
      role: z.string(),
      context: z.object({ label: z.string(), value: z.string() }),
      stack: z.array(z.string()),
      url: z.string().url().optional(),
      appStore: z.string().url().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      mobile: image().optional(),
      mobileAlt: z.string().optional(),
      features: z.array(z.string()).default([]),
      outcome: z.string(),
    }),
});

// Lab: experiments, side quests, unfinished things.
const lab = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lab" }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    file: z.string(), // terminal-style name, e.g. terminal_orders.exe
    kind: z.string(),
    tagline: z.string(),
    summary: z.string(),
    status: z.enum(["Unfinished", "Ongoing", "Done"]),
    year: z.number(),
    stack: z.array(z.string()),
    play: z.string().url().optional(),
    playNote: z.string().optional(),
    source: z.string().url().optional(),
    roadmap: z.array(z.object({ item: z.string(), done: z.boolean().default(false) })).default([]),
  }),
});

export const collections = { work, lab };
