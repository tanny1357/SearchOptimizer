from fastapi import APIRouter, Request, Query
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import numpy as np

router = APIRouter()

# Load model + products
model = SentenceTransformer('all-MiniLM-L6-v2')
with open("products.json", "r") as f:
    products = json.load(f)

# Create suggestion bank (product titles, categories, brands etc.)
suggestion_bank = list({p["title"] for p in products})

@router.get("/search")
async def search(query: str = Query(...), semantic: bool = Query(False)):
    query = query.strip().lower()

    if not query:
        return {"suggestions": [], "results": []}

    suggestions = [s for s in suggestion_bank if query in s.lower()]
    suggestions = sorted(suggestions)[:6]

    if not semantic:
        return {"suggestions": suggestions}

    # Semantic search
    query_embedding = model.encode([query])
    product_embeddings = [p["embedding"] for p in products]
    similarities = cosine_similarity(query_embedding, product_embeddings)[0]

    scored_products = [
        {"title": p["title"], "description": p["description"], "score": float(score)}
        for p, score in zip(products, similarities)
    ]
    scored_products.sort(key=lambda x: x["score"], reverse=True)

    return {
        "suggestions": suggestions,
        "results": scored_products[:10]
    }
