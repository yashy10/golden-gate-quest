from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
import io
import os
import uvicorn

from embedding_service import NemotronEmbeddingService
from vector_store import CuVSVectorStore

app = FastAPI(title="SF Cultural Impact RAG API")

# Global instances (loaded on startup)
embedder: NemotronEmbeddingService = None
_diffusion_pipe = None
_diffusion_model_id: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    category_filter: Optional[str] = None  # e.g., "landmarks", "film_locations"

class SearchResult(BaseModel):
    id: str
    category: str
    text: str
    score: float
    metadata: dict
    location: dict

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

@app.on_event("startup")
async def load_models():
    """Load embedding model and vector store on startup"""
    global embedder, vector_store
    
    print("Loading embedding model...")
    embedder = NemotronEmbeddingService()
    
    print("Loading vector store...")
    vector_store = CuVSVectorStore(embedding_dim=2048)
    vector_store.load("vector_db")
    
    print("RAG API ready!")

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search for relevant locations based on query"""
    
    # Generate query embedding
    query_embedding = embedder.embed_query(request.query)
    
    # Search vector store
    results = vector_store.search(query_embedding, top_k=request.top_k * 2)
    
    # Apply category filter if specified
    if request.category_filter:
        results = [
            (doc, score) for doc, score in results 
            if doc['category'] == request.category_filter
        ]
    
    # Format response
    search_results = []
    for doc, score in results[:request.top_k]:
        search_results.append(SearchResult(
            id=doc['id'],
            category=doc['category'],
            text=doc['text'],
            score=score,
            metadata=doc['metadata'],
            location=doc['location']
        ))
    
    return SearchResponse(query=request.query, results=search_results)

@app.get("/categories")
async def list_categories():
    """List available categories"""
    categories = set(doc['category'] for doc in vector_store.documents)
    return {"categories": list(categories)}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "documents_indexed": len(vector_store.documents)}


def _get_diffusion_pipe(model_id: str):
    """
    Lazy-load diffusion pipeline to avoid paying startup cost unless used.
    Uses env `DIFFUSION_MODEL_ID` if present, otherwise caller passes it.
    """
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
        # matches your `diffusion_sample/run.py` behavior (offload + slicing)
        pipe.enable_sequential_cpu_offload()
        pipe.enable_attention_slicing()
    else:
        pipe.to(device)

    _diffusion_pipe = pipe
    _diffusion_model_id = model_id
    return _diffusion_pipe


@app.post("/diffusion/flux2klein/img2img")
async def diffusion_flux2klein_img2img(
    prompt: str,
    init_image: UploadFile = File(...),
    height: int = 1024,
    width: int = 576,
    guidance_scale: float = 10.0,
    num_inference_steps: int = 4,
    seed: int = 0,
    model_id: Optional[str] = None,
):
    """
    Image-to-image endpoint based on `diffusion_sample/run.py`.
    Returns a PNG image.
    """
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9005)