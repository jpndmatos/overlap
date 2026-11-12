# Overlap

Find a meeting time across cities, compare working hours and export a calendar invite. React, TypeScript and the Intl API.

[Open app](https://jpndmatos.github.io/overlap/)

## Run

Node.js 22.14+.

```sh
npm ci
npm run dev
```

Open http://localhost:5176. City preferences and saved meeting options stay in your browser.

## Check

```sh
npm test
npm run build
```

Use `npm run preview` to serve the build. With the app running, `npm run test:browser` checks calendar export, time-zone changes, responsive layouts and accessibility. Install Chromium with `npx playwright install chromium` first.

Meeting times use IANA time zones, including daylight-saving changes. Changing the reference city preserves the selected instant.
