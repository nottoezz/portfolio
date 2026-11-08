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

export const collections = { work };
