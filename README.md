# ICPEP Tabulator System

Pageant scoring for one admin/tabulator laptop and up to 5 judges on their own phones or tablets, over local Wi-Fi.

## Run it (Windows PowerShell)

```powershell
npm.cmd install      # first time only
npm.cmd run dev
```

The terminal prints:

- **Local:** `http://localhost:3000` — open this on the admin laptop
- **Network:** `http://192.168.x.x:3000` — judges open this on their phones (same Wi-Fi). Use the address for your Wi-Fi adapter, not vEthernet/WSL/VirtualBox ones.
- **Admin PIN** — sign in as Admin with this

Judge PINs are on the admin dashboard under **Judges & Access** (click *Show PINs*). Keep the terminal open for the whole event.

For the event itself you can use `npm.cmd start` instead. It builds an optimized version, which loads faster on phones.

## How it works

- `server/tabulator.js` is the scoring server. It runs on the same port as the app (wired in through `vite.config.js`), keeps the one official copy of all data, and checks every action: judges can only submit their own scores, only complete and in-range scores, and only while the category is unlocked.
- Everything is saved to `data/tabulator-data.json` after every change, so restarting the laptop doesn't lose scores. "Reset All" saves a backup file in `data/` first.
- `src/composables/useTabulator.js` is the app's connection to the server.

## Troubleshooting

- **Phone can't open the page:** allow Node.js through Windows Firewall for Private networks, and set the Wi-Fi network profile to Private.
- **Forgot the admin PIN:** it's printed every time the server starts, and it's also the `adminPin` value in `data/tabulator-data.json`.
- **A judge's PIN leaked:** click *New PIN* for that judge. They're signed out on every device.
- **Start completely fresh:** stop the server, delete the `data` folder, start again. New PINs are generated.
