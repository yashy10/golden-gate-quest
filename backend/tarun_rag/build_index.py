# build_index.py
import sys
from pathlib import Path
from tqdm import tqdm

from csv_processor import SimpleCSVProcessor
from embedding_service import NemotronEmbeddingService
from vector_store import CuVSVectorStore

def build_rag_index(
    data_dir: str = "sf_data",
    output_dir: str = "vector_db",
    batch_size: int = 32
):
    """Build the complete RAG index"""
    
    print("Step 1: Loading CSV data...")
    processor = SimpleCSVProcessor(data_dir)
    documents = processor.load_all()
    print(f"Loaded {len(documents)} documents")
    
    print("\nStep 2: Initializing embedding model...")
    embedder = NemotronEmbeddingService()
    
    print("\nStep 3: Generating embeddings...")
    all_embeddings = []
    texts = [doc['text'] for doc in documents]
    
    # Process in batches to avoid OOM
    for i in tqdm(range(0, len(texts), batch_size)):
        batch = texts[i:i + batch_size]
        embeddings = embedder.embed_documents(batch)
        all_embeddings.append(embeddings)
    
    import numpy as np
    all_embeddings = np.vstack(all_embeddings)
    print(f"Generated embeddings shape: {all_embeddings.shape}")
    
    print("\nStep 4: Building vector index...")
    vector_store = CuVSVectorStore(embedding_dim=2048)
    vector_store.build_index(all_embeddings, documents)
    
    print("\nStep 5: Saving index...")
    vector_store.save(output_dir)
    print(f"Index saved to {output_dir}/")
    
    # Quick test
    print("\nStep 6: Testing search...")
    test_query = "historic landmarks in San Francisco with cultural significance"
    query_emb = embedder.embed_query(test_query)
    results = vector_store.search(query_emb, top_k=3)
    
    print(f"\nTest query: '{test_query}'")
    for doc, score in results:
        print(f"  [{score:.4f}] {doc['category']}: {doc['text'][:100]}...")

if __name__ == "__main__":
    build_rag_index()