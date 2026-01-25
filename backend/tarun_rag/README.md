# tarun_shit (RAG + TTS + Diffusion in one container)

This folder runs **three services** inside a single GPU-enabled container:

- **TTS**: `http://localhost:9000`
- **RAG API**: `http://localhost:9005`
- **Diffusion API**: `http://localhost:9006`

## Start the Docker container (interactive)

From your host machine:

```bash
docker run --gpus all -it --name tarun-rag \
  -p 9000:9000 \
  -p 9005:9005 \
  -p 9006:9006 \
  -v "/home/dell/Documents/tarun_shit:/rag" \
  -w /rag \
  nvcr.io/nvidia/pytorch:25.12-py3 \
  bash
```

## Inside the container: install deps + start everything

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt

# optional: if the diffusion model needs HF auth
# huggingface-cli login

bash /rag/start.sh
```

`start.sh` starts:
- `pocket-tts serve` on `0.0.0.0:9000`
- `uvicorn rag_api:app` on `0.0.0.0:9005`
- `uvicorn diffusion_api:app` on `0.0.0.0:9006`

## Quick checks

RAG health:

```bash
curl http://localhost:9005/health
```

Diffusion health:

```bash
curl http://localhost:9006/health
```

RAG search example:

```bash
curl -s http://localhost:9005/search \
  -H "Content-Type: application/json" \
  -d '{"query":"golden gate bridge", "top_k": 3}'
```

Diffusion img2img example (returns a PNG):

```bash
curl -o out.png -X POST "http://localhost:9006/flux2klein/img2img?prompt=hello" \
  -F "init_image=@/rag/diffusion_sample/image.png"
```

## Notes

- Services bind to **`0.0.0.0`** so Docker `-p` port publishing works.
- If you want different host ports, map as `HOST:CONTAINER` (example: `-p 8000:9005`).


after the local enpoints setup use ngrok

ngrok http 19000
ngrok http 19005
ngrok http 19006

or 


mkdir -p ~/.config/ngrok

cat > ~/.config/ngrok/ngrok.yml <<'EOF'
version: "2"
tunnels:
  tts:
    proto: http
    addr: 19000
  rag:
    proto: http
    addr: 19005
  diffusion:
    proto: http
    addr: 19006
EOF

ngrok -start-all
