---
order: 2
title: Klinkende Klanke
kind: Afrikaans early-literacy app
tagline: Songs × phonics × tracing.
summary: A playful mobile app that helps Grade 1 learners master Afrikaans sounds, letters and early reading, with a story, a song and an action for every letter.
status: Live
role: Solo designer & developer
context:
  label: Audience
  value: Grade 1 learners, teachers & parents
stack: [React Native, Custom SVG tracing engine, Audio engine, Offline-first storage]
url: https://klinkende-klanke.co.za/
appStore: https://apps.apple.com/za/app/klinkende-klanke/id6775409081
cover: ../../assets/work/klanke.png
coverAlt: The Klinkende Klanke site, headed “Leer Afrikaans. Reg van die begin.” beside a phone showing a colourful letter picker.
mobile: ../../assets/work/klanke-m.png
mobileAlt: The Klinkende Klanke site on a phone.
features:
  - Phonics-based learning framework
  - Guided letter tracing with stroke order
  - A story and song for every letter
  - Interactive sound games
  - Parent & teacher progress tracking
  - Works fully offline, with no account needed
outcome: Live on the Apple App Store since June 2026, free to download. It gives Afrikaans learners a local-language alternative and gives teachers a ready-made digital supplement for early literacy.
---

## The brief

Early-literacy apps are overwhelmingly English. Afrikaans-speaking Grade 1 learners, and the teachers supporting them, had few good options that teach letters the way they’re taught in the classroom.

## What I did

**Product & learning design.** I studied early-literacy teaching methods, designed the learning progression, and wrote UX copy pitched at five- and six-year-olds.

**Engineering.** I built the app in React Native, including a custom SVG letter-tracing system, an audio engine, and lightweight local storage so everything works offline.

## The hard parts

- Teaching letter formation on a touchscreen, including stroke order, without frustrating small hands.
- Designing for children who can’t read yet, so the interface has to lead with audio.
- Keeping it fast on the low-end devices common in schools.

## Approach

A multi-step tracing validator, audio-first UI, songs built into the lessons, small rewarding micro-interactions, and a deliberately lightweight architecture with local caching. There are no accounts, nothing is collected from children, and there’s a parental gate on every external link.
