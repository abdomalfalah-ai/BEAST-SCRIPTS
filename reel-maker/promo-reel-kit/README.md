# Beast Coaching reel kit

Re‑render the 30s vertical "How Beast Coaching works" reel (1080×1920, bilingual
AR+EN) entirely locally — **no Higgsfield / no AI service, no credits**.

It builds an animated HTML scene file, captures it frame‑by‑frame with Playwright
(deterministic, the same technique Remotion uses), and encodes an H.264 MP4. The
phone frames in scenes 2–5 show **real screenshots of the live site**.

## Prerequisites (already in this repo)
- Python venv with Pillow + imageio‑ffmpeg (`pip install imageio-ffmpeg`)
- Node + Playwright with Chromium (`npx playwright install chromium`)

## Steps

```bash
# 1. (only if you want fresh site screenshots) run the app, then shoot it
HOST=0.0.0.0 PORT=5000 python app.py            # in one terminal
node tools/reel/shoot_site.mjs                  # writes tools/reel/_shots/*.png
#    portal shot uses DEMO01/2026 — override: PORTAL_CODE=EGxx PORTAL_PIN=1234

# 2. build the self-contained scene file (embeds logo, portrait, font, shots)
python tools/reel/build_reel.py                 # -> tools/reel/reel.html

# 3. render 900 frames, then encode
node tools/reel/capture.mjs frames 30 30        # -> tools/reel/frames/*.png
python tools/reel/encode.py                     # -> Beast_Coaching_Reel.mp4 (Desktop)
```

Preview one frame per scene without a full render:
`node tools/reel/capture.mjs preview` → `tools/reel/preview/*.png`.

## Editing
All copy, timing, scene windows, and prices live in the `HTML` string in
`build_reel.py` (search for the scene comments `S1`..`S7`). Each animated element
is driven by `data-in` (start time, seconds) and `data-ty` (rise distance); the
`seek(t)` function at the bottom interpolates everything, so the capture is
deterministic. Change text → rebuild (step 2) → re‑render (step 3).

## Audio
Delivered silent on purpose — add a *trending* audio in the Instagram/TikTok app
on upload (the algorithm favors native sound; the burned‑in captions carry it on
mute).

`_shots/`, `frames/`, `preview/`, and `reel.html` are build artifacts (gitignored).
