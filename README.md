# 2026 · 19 of 23 run

Unofficial fan site. You travel a real racing line, and the season is placed along it.

The 2026 championship is still live: Antonelli 380, Verstappen 261, Hamilton 259, four rounds unrun. This is not a dashboard. The circuit is the navigation.

Not affiliated with Formula 1. [Fan-site guidelines](https://www.formula1.com/en/information/guidelines.4EOKE9RRqevL4niTK9kWyt).

## Pull & run (Windows)

Aditya’s working folder:

```powershell
cd "C:\All Data\Studies\Luma Hackathons\F1 paddock"
git fetch origin
git checkout main
git pull origin main
npm install
npm run dev
```

Fresh clone (GitHub):

```powershell
git clone https://github.com/aditya-devangbhai-shah/kickstart.git "C:\All Data\Studies\Luma Hackathons\F1 paddock"
cd "C:\All Data\Studies\Luma Hackathons\F1 paddock"
npm install
npm run dev
```

Or from Origin:

```powershell
git clone https://origin.cursor.com/git/aditya-devangbhai-shah/kickstart.git "C:\All Data\Studies\Luma Hackathons\F1 paddock"
cd "C:\All Data\Studies\Luma Hackathons\F1 paddock"
npm install
npm run dev
```

Open [http://localhost:43217](http://localhost:43217). Five red lights, then Spa. Needs **Node 20+**. No API keys or secrets.

## Deploy (Vercel)

From the same folder:

```powershell
npx vercel
```

Follow the prompts. Production:

```powershell
npx vercel --prod
```

`vercel.json` already pins the project. No env vars required for local or deploy.

## What you are looking at

- **Lights-out** is the loader. It does not replay in the same tab.
- **Scroll** drives the camera along OpenF1 position telemetry. Flat asphalt with white edge lines and red/white kerbs in the corners; the racing line glows gold/cream on the gas, red on the brakes.
- **Calendar strip** across the top is all 23 rounds in race order: circuit outline, flag, round, place. Click one to load its track and land on its results. The four unrun rounds are dimmed.
- **Rounds** sit on the line as waving country flags on poles. Each completed stop has a podium below the track, plus a purple fastest lap. The four unrun rounds fly smaller, faded flags.
- **Chequered flag** closes the lap: a finish gantry, the Drivers' World Champion (Antonelli, clinched with four to go) and the Constructors' leader, with both standings in the dock.
- **This race** is the top 10, five names left and five right, flanking the circuit — full-colour Commons portraits.
- **Standings** use `season-arc.json`. Colour is the team. Pattern / driver code breaks Audi vs Ferrari.
- **Drivers** show a colour Commons portrait, a generated helmet, and the race number.

The browser never calls OpenF1 `car_data` or `location`. Everything under `public/data/` is prebaked. Portraits are cached in `public/portraits/` (Wikimedia Commons / Wikipedia, typically CC BY-SA). Flags are local SVGs in `public/flags/`.

`prefers-reduced-motion: reduce` swaps the camera for a static map and readable copy.

## Data

```
npm run prebake
npm run validate
```

See the frozen data contract in the project store (`internal/data-contract.md`).
