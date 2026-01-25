import io
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response

app = FastAPI(title="Diffusion API")

_diffusion_pipe = None
_diffusion_model_id: Optional[str] = None


def _get_diffusion_pipe(model_id: str):
    global _diffusion_pipe, _diffusion_model_id

    if _diffusion_pipe is not None and _diffusion_model_id == model_id:
        return _diffusion_pipe

    try:
        import torch
        from diffusers import Flux2KleinPipeline
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Diffusion dependencies not available. Install `diffusers` and `torch` "
                f"inside the container. Import error: {type(e).__name__}: {e}"
            ),
        )

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    pipe = Flux2KleinPipeline.from_pretrained(model_id, torch_dtype=dtype)
    if device == "cuda":
        pipe.enable_sequential_cpu_offload()
        pipe.enable_attention_slicing()
    else:
        pipe.to(device)

    _diffusion_pipe = pipe
    _diffusion_model_id = model_id
    return _diffusion_pipe


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/flux2klein/img2img")
async def flux2klein_img2img(
    prompt: str,
    init_image: UploadFile = File(...),
    height: int = 1024,
    width: int = 576,
    guidance_scale: float = 10.0,
    num_inference_steps: int = 4,
    seed: int = 0,
    model_id: Optional[str] = None,
):
    effective_model_id = model_id or os.getenv("DIFFUSION_MODEL_ID") or "black-forest-labs/FLUX.2-klein-4B"

    try:
        import torch
        from PIL import Image
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Missing runtime deps for diffusion endpoint: {type(e).__name__}: {e}",
        )

    raw = await init_image.read()
    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image upload: {type(e).__name__}: {e}")

    pipe = _get_diffusion_pipe(effective_model_id)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    gen = torch.Generator(device=device).manual_seed(seed)

    try:
        out = pipe(
            prompt=prompt,
            image=pil,
            height=height,
            width=width,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=gen,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diffusion generation failed: {type(e).__name__}: {e}")

    buf = io.BytesIO()
    out.images[0].save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")

