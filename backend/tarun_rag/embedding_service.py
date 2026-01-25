# embedding_service.py
import torch
from transformers import AutoModel, AutoConfig
from typing import List
import numpy as np

class NemotronEmbeddingService:
    """Embedding service using NVIDIA llama-nemotron-embed-vl-1b-v2"""
    
    def __init__(self, device: str = "cuda"):
        self.device = device
        self.model_name = "nvidia/llama-nemotron-embed-vl-1b-v2"
        
        # Load config and force eager attention everywhere
        config = AutoConfig.from_pretrained(
            self.model_name,
            trust_remote_code=True
        )
        
        # Force eager attention at all levels
        def set_eager_attention(cfg):
            cfg._attn_implementation = "eager"
            cfg._attn_implementation_autoset = False
            if hasattr(cfg, '_attn_implementation_internal'):
                cfg._attn_implementation_internal = "eager"
            # Recursively set on nested configs
            for attr in ['llm_config', 'vision_config', 'text_config']:
                if hasattr(cfg, attr) and getattr(cfg, attr) is not None:
                    set_eager_attention(getattr(cfg, attr))
        
        set_eager_attention(config)
        
        # Load model
        self.model = AutoModel.from_pretrained(
            self.model_name,
            config=config,
            dtype=torch.bfloat16,
            trust_remote_code=True,
            attn_implementation="eager",
            device_map="auto"
        ).eval()
        
        self.model.processor.p_max_length = 8192
        
    def embed_documents(self, texts: List[str]) -> np.ndarray:
        with torch.inference_mode():
            embeddings = self.model.encode_documents(texts=texts)
        return embeddings.float().cpu().numpy()
    
    def embed_query(self, query: str) -> np.ndarray:
        with torch.inference_mode():
            embedding = self.model.encode_queries([query])
        return embedding.float().cpu().numpy()
    
    @property
    def embedding_dim(self) -> int:
        return 2048