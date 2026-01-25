Command to spin up the docker container with nemotron
```bash
docker run -it --gpus all \
  --ipc=host \
  --ulimit memlock=-1 \
  --ulimit stack=67108864 \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  -v /home/dell/Documents/vllm:/models \
  -p 8022:8000 \
  nvcr.io/nvidia/vllm:25.12.post1-py3 \
  vllm serve /models/models--nvidia--NVIDIA-Nemotron-3-Nano-30B-A3B-FP8/snapshots/f25a17a817ca1aa7e4d9650456a355c678e478b0 \
  --host 0.0.0.0 \
  --port 8000 \
  --gpu-memory-utilization 0.3 \
  --kv-cache-dtype fp8 \
  --max-model-len 2000 \
  --trust-remote-code \
  --served-model-name nemotron-30b
```
Command to send requests to nemotron container
```bash
curl http://192.168.128.247:8022/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nemotron-30b",
    "messages": [
      {
        "role": "user",
        "content": "What landmark is the Eiffel Tower and what can you tell me about its history?"
      }
    ],
    "max_tokens": 1900
  }'
```
