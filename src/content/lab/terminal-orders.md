---
order: 1
title: Terminal Orders
file: terminal_orders.exe
kind: Browser horror-cooking game
tagline: Type. Cook. Survive.
summary: You wake up in a dark, low-poly kitchen. A terminal flickers on. The orders start coming in, and they’re getting stranger.
status: Unfinished
year: 2025
stack: [JavaScript, Three.js, Canvas, TheMealDB API, Web Audio]
play: https://nottoezz.github.io/OrdersPlease/
playNote: Desktop, sound on, lights off.
source: https://github.com/nottoezz/OrdersPlease
roadmap:
  - item: Intro sequence & CRT terminal
    done: true
  - item: Cryptic radio orders via TheMealDB
    done: true
  - item: Fridge, tools & microwave loop
    done: true
  - item: Smoother, more expressive animations
  - item: Better sound design
  - item: Hints that don’t break immersion
  - item: A figure
  - item: An ending
---

Terminal Orders started as a course project and became my playground for atmosphere. It’s a horror game where the only interface is a glowing terminal and the only goal is to cook what it asks for.

## How it plays

Click the terminal and it boots with CRT flicker and typing sounds. A cryptic poem arrives over the radio with the next order hidden in it. You pick from the fridge, work through the tools, and hope the microwave agrees with you.

## What’s under the hood

A Three.js kitchen with custom lighting and post-processing. A Canvas-rendered terminal with syntax highlighting. Real recipes from TheMealDB, bent into something eerie. Layered ambient audio, flickering fluorescents and session persistence, all in modular vanilla JavaScript.

## Why it’s in the lab

It isn’t finished. There’s no ending yet, and something is supposed to be standing in the corner. I’d rather show it honestly as a work in progress than polish it into a case study.
