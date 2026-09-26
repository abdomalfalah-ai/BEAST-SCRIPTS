# -*- coding: utf-8 -*-
"""Encode tools/reel/frames/*.png into an H.264 MP4 using imageio-ffmpeg's
bundled ffmpeg (no system ffmpeg needed). Output: Desktop/Beast_Coaching_Reel.mp4
(override with: python encode.py <output_path>)."""
import os
import subprocess
import sys

import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(HERE, "frames", "%04d.png")
DEFAULT_OUT = os.path.join(os.path.expanduser("~"), "Desktop", "Beast_Coaching_Reel.mp4")
out = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT

exe = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [exe, "-y", "-framerate", "30", "-i", FRAMES,
       "-c:v", "libx264", "-preset", "medium", "-crf", "18",
       "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30", out]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    sys.stderr.write(r.stderr[-1000:])
    sys.exit(r.returncode)
print(f"wrote {out} ({os.path.getsize(out) // 1024} KB)")
