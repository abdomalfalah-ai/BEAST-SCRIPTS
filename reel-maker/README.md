# Reel maker

Moved out of the Beast Coaching app on 26 Sep 2026 (it was at /coach/app/reel).

## builder/ : Reel Builder ("full workout in 30 seconds")
One self-contained page. Everything runs in the browser, and clips never leave the device.
Open `builder/index.html` from any static server in this folder (for example `npx serve reel-maker/builder`).
Opening the file directly also works, but some browsers block the logo watermark on `file://`.

## promo-reel-kit/ : the "How Beast Coaching works" promo reel
The scripts that render the 30 s bilingual promo MP4 (Playwright capture + ffmpeg).
They were written to run from inside the Beast_Coaching_App repo (`tools/reel/...`) and
read its logo, fonts and a running local copy of the app for screenshots.
To use them again, copy this folder back to `Beast_Coaching_App/tools/reel/` and follow its README.
