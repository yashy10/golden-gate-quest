#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Run all services inside one container:
# - TTS:        :9000
# - RAG API:     :9005
# - Diffusion:   :9006
#
# IMPORTANT: bind to 0.0.0.0 so Docker port publishing works.

TTS_PID=""
if command -v pocket-tts >/dev/null 2>&1; then
  pocket-tts serve --host 0.0.0.0 --port 9000 &
  TTS_PID=$!
else
  echo "WARNING: pocket-tts not found. Install it with: pip install pocket-tts"
  echo "         Continuing with RAG + Diffusion only."
fi

uvicorn rag_api:app --host 0.0.0.0 --port 9005 &
RAG_PID=$!

uvicorn diffusion_api:app --host 0.0.0.0 --port 9006 &
DIFF_PID=$!

cleanup() {
  kill "$DIFF_PID" "$RAG_PID" 2>/dev/null || true
  if [[ -n "${TTS_PID}" ]]; then
    kill "$TTS_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Keep the container alive; exit if any process exits.
if [[ -n "${TTS_PID}" ]]; then
  wait -n "$TTS_PID" "$RAG_PID" "$DIFF_PID"
else
  wait -n "$RAG_PID" "$DIFF_PID"
fi