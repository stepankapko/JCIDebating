# JCI Debating Duel

Educational HTML + Three.js debating game in JCI branding.

## Features
- **Single Player** vs AI opponent
- **Duel** mode — two players on one phone, passing the device
- **Claude API** as the judge (scores argument, evidence, rebuttal, delivery out of 100)
- **Theory** section with core debating rules & PREP structure
- **Leaderboard** stored in browser (localStorage) — persistent on the device
- **Three.js** animated background (JCI blue wireframe arena)

## Run
Just open `index.html` in a browser, or serve locally:

```
python3 -m http.server 8080
```

Then open http://localhost:8080

## Claude API Key
Go to **Settings** and paste your `sk-ant-...` key. It is stored only in your
browser's localStorage. Without a key, a local heuristic judge is used as fallback.

## Scoring Criteria (JCI guidelines)
- Argument strength (0–25)
- Evidence & examples (0–25)
- Rebuttal & engagement (0–25)
- Delivery & structure (0–25)
