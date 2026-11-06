# 2026 · 19 of 23 run

Unofficial fan site. You travel a real racing line, and the season is placed along it.

The 2026 championship is still live: Antonelli 380, Verstappen 261, Hamilton 259, four rounds unrun. This is not a dashboard. The circuit is the navigation.

Not affiliated with Formula 1. [Fan-site guidelines](https://www.formula1.com/en/information/guidelines.4EOKE9RRqevL4niTK9kWyt).

## Run locally (Windows)

The GitHub / Origin clone only works after the repository exists. Browse: [aditya-devangbhai-shah/kickstart](https://cursor.com/codebase/aditya-devangbhai-shah/kickstart).

In PowerShell:

```powershell
git clone https://github.com/aditya-devangbhai-shah/kickstart.git "C:\All Data\Studies\Luma Hackathons\F1 paddock"
cd "C:\All Data\Studies\Luma Hackathons\F1 paddock"
git checkout cursor/f1-paddock-circuit-instrument-09a4
npm install
npm run dev
```

If GitHub is not the remote yet, clone from Origin instead:

```powershell
git clone https://origin.cursor.com/git/aditya-devangbhai-shah/kickstart.git "C:\All Data\Studies\Luma Hackathons\F1 paddock"
```

Open [http://localhost:43217](http://localhost:43217). Five red lights, then the pause, then Spa.

Needs Node 20+.

## What you are looking at

- **Lights-out** is the loader. It does not replay in the same tab.
- **Scroll** drives the camera along OpenF1 position telemetry, extruded as a ribbon. Straights open the lens; brake marks pull you in.
- **Rounds** sit on the line. Chequered pins are run. Four unlit pins (Interlagos, Vegas, Losail, Yas Marina) are empty on purpose.
- **Standings** use `season-arc.json`. Colour is the team. Pattern / driver code breaks Audi vs Ferrari.
- **Drivers** are generated from `speedTrace`, not headshots.
- **Circuit tape** is built from `index.json`. Bahrain GP is `sepang` (Malaysia). Spa and the Red Bull Ring climb.

The browser never calls OpenF1 `car_data` or `location`. Everything under `public/data/` is prebaked.

`prefers-reduced-motion: reduce` swaps the camera for a static map and readable copy.

## Data

```
npm run prebake
npm run validate
```

See the frozen data contract in the project store (`internal/data-contract.md`).
