from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and product data
model = SentenceTransformer('all-MiniLM-L6-v2')
with open("products.json", "r") as f:
    products = json.load(f)

@app.post("/semantic-search")
async def semantic_search(request: Request):
    body = await request.json()
    query = body["query"]

    query_embedding = model.encode([query])
    product_embeddings = [p["embedding"] for p in products]
    similarities = cosine_similarity(query_embedding, product_embeddings)[0]

    # Pair similarity scores with products
    scored_products = [
        {"title": p["title"], "description": p["description"], "score": float(score)}
        for p, score in zip(products, similarities)
    ]

    # Sort by score descending
    scored_products.sort(key=lambda x: x["score"], reverse=True)

    # Return top 10 (optional)
    return scored_products[:10]
