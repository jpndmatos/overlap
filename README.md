# Overlap

A time zone planner for arranging meetings. Add cities, compare working hours, and choose a meeting time. You can copy the details or save a calendar file.

[Open Overlap](https://jpndmatos.github.io/overlap/)

![overlap workspace](docs/workspace.png)

<details>
  <summary>Mobile view</summary>
  <br>
  <img src="docs/mobile.png" alt="Overlap mobile interface" width="320">
</details>

## Features

- Search cities and compare up to eight time zones.
- Set working hours, a meeting date, start time, and duration.
- Find shared availability with daylight-saving adjustments.
- Switch the reference city and view each location's local time.
- Copy meeting times or download an ICS file.
- Six named meeting-time bookmarks, saved city preferences, and a dedicated visual design.

The desktop dashboard keeps the timeline and meeting options together, with long city lists contained inside the timeline panel.

## Stack

React, TypeScript, Vite, and the Intl API.

## Run locally

Requires Node.js 22.14 or later.

```sh
npm ci
npm run dev
```

Open [localhost:5176](http://localhost:5176).

```sh
npm test
npm run build
npm run preview
```

## Interface

A blue daylight planner with full-width city timelines, monospaced local clocks and meeting actions below the schedule. Local preferences, saved meetings and calendar exports work independently of any server.

Each repository builds independently. System fonts keep the initial view free of font downloads.

## Verification

The production build and unit tests pass. Portfolio integration checks cover the main workflows at 390px and 1440px, WCAG A/AA checks including WCAG 2.2 target sizes, and failure handling. The mobile Lighthouse lab result is saved in `docs/performance.json`; it is a local observation, not a field-performance guarantee.
