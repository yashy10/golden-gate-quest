#!/usr/bin/env bash
set -euo pipefail

cd ~/Documents/tarun_tts
source env/bin/activate

# start TTS in background
pocket-tts serve --host 127.0.0.1 --port 9000 &
TTS_PID=$!

# stop TTS when you Ctrl+C
trap 'kill "$TTS_PID" 2>/dev/null || true' EXIT INT TERM

# start ngrok in foreground
ngrok http 9000