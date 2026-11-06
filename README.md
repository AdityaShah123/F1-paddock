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
- **Scroll** drives the camera along OpenF1 position telemetry. The racing line is a lit ribbon: gold/cream on the gas, red on the brakes, and Spa actually climbs.
- **Rounds** sit on the line. Each completed stop has a podium bar plot (P1 tallest) plus a purple fastest lap. Four unlit pins (Interlagos, Vegas, Losail, Yas Marina) are empty on purpose.
- **This race** is a classification table (top 10, expand for the rest) that follows you from round to round.
- **Standings** use `season-arc.json`. Colour is the team. Pattern / driver code breaks Audi vs Ferrari.
- **Drivers** show a Commons portrait (duotoned in team colour), a generated helmet, and the race number. Colour still cannot identify a driver alone.
- **Circuit tape** uses the full race name and locality, never slugs. Bahrain GP is Sepang.

The browser never calls OpenF1 `car_data` or `location`. Everything under `public/data/` is prebaked. Portraits are cached in `public/portraits/` (Wikimedia Commons / Wikipedia, typically CC BY-SA).

`prefers-reduced-motion: reduce` swaps the camera for a static map and readable copy.

## Data

```
npm run prebake
npm run validate
```

See the frozen data contract in the project store (`internal/data-contract.md`).
