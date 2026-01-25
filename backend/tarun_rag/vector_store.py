# vector_store_cuvs.py
import cuvs
from cuvs.neighbors import cagra
import cupy as cp
import numpy as np
import json
from pathlib import Path

class CuVSVectorStore:
    """Direct cuVS vector store using CAGRA algorithm"""
    
    def __init__(self, embedding_dim: int = 2048):
        self.embedding_dim = embedding_dim
        self.index = None
        self.documents = []
        
    def build_index(self, embeddings: np.ndarray, documents: list):
        """Build CAGRA index"""
        self.documents = documents
        
        # Convert to cupy array on GPU
        embeddings_gpu = cp.asarray(embeddings, dtype=cp.float32)
        
        # Build CAGRA index (graph-based, very fast)
        index_params = cagra.IndexParams(
            intermediate_graph_degree=64,
            graph_degree=32
        )
        self.index = cagra.build(index_params, embeddings_gpu)
        
    def search(self, query_embedding: np.ndarray, top_k: int = 10):
        """Search using CAGRA"""
        query_gpu = cp.asarray(query_embedding, dtype=cp.float32)

        search_params = cagra.SearchParams()
        distances_dev, neighbors_dev = cagra.search(
            search_params, self.index, query_gpu, top_k
        )

        # cuVS returns device_ndarray; convert to CuPy for indexing/get()
        distances = cp.asarray(distances_dev)
        neighbors = cp.asarray(neighbors_dev)

        # move to host numpy for iteration
        neighbors_h = cp.asnumpy(neighbors)
        distances_h = cp.asnumpy(distances)

        # handle shape (k,) vs (1,k)
        if neighbors_h.ndim == 2:
            neighbors_h = neighbors_h[0]
            distances_h = distances_h[0]

        results = []
        for idx, dist in zip(neighbors_h, distances_h):
            results.append((self.documents[int(idx)], float(dist)))
        return results

    def save(self, output_dir: str):
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)

        # saves ANN index (+ dataset if include_dataset=True)
        cagra.save(str(out / "cagra_index.bin"), self.index, include_dataset=True)

        # save metadata docs so search indices map back to docs
        with (out / "documents.jsonl").open("w", encoding="utf-8") as f:
            for doc in self.documents:
                f.write(json.dumps(doc, ensure_ascii=False) + "\n")

        with (out / "meta.json").open("w", encoding="utf-8") as f:
            json.dump({"embedding_dim": self.embedding_dim}, f)

    def load(self, input_dir: str):
        inp = Path(input_dir)

        self.index = cagra.load(str(inp / "cagra_index.bin"))

        self.documents = []
        with (inp / "documents.jsonl").open("r", encoding="utf-8") as f:
            for line in f:
                self.documents.append(json.loads(line))