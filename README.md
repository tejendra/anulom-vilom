# Anulom Vilom

A minimal, single-page web app for guided **anulom vilom** (alternate nostril) breathing: inhale through one nostril, exhale through the other, then reverse for the next cycle.

## Features

- **5, 10, or 15 minute session** with a 3-second prep countdown; stops after the current full round when time is up
- **Optimize for**: Default (balanced ladder), Athletic, Stillness (meditation), or CO₂ tolerance—each with its own timing presets
- **Pattern levels**:
  - In / Out
  - In / Hold / Out
  - In / Out / Hold
  - In / Hold / Out / Hold
- **Duration presets** per goal and pattern (seconds per phase)
- **Visual cue**: ring animation and on-screen phase labels (Inhale, Exhale, Hold)
- **Audio cues** for inhale, exhale, and hold (Web Audio API + bundled clips)
- **Remembers your choices** in `localStorage`
- Collapsible **instructions** and a short **disclaimer** (not medical advice)

## Usage

1. Choose **Optimize for** and **Pattern**, then pick a **Duration** preset and a **Session length**.
2. Click **Start** (or tap the circle during a session to stop).
3. Follow each phase: inhale through the open nostril, exhale through the other; add holds only when your pattern includes them.
4. Stop if you feel dizzy, agitated, or unwell.

## Run locally

From the project root, start a simple HTTP server with Python 3:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Use another port if 8000 is taken, e.g. `python3 -m http.server 3000`.

## Disclaimer

This app is for personal breath practice only. It is **not medical advice**. If you are unsure whether breath work is appropriate for you, consult a qualified clinician before use.
