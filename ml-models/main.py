from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import shutil
from caption_image import generate_caption
from search import router as search_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)

model = SentenceTransformer('all-MiniLM-L6-v2')

with open("products.json", "r") as f:
    products = json.load(f)

@app.post("/semantic-search")
async def semantic_search(request: Request):
    body = await request.json()
    query = body["query"]
    query_lower = query.lower()

    query_embedding = model.encode([query])
    product_embeddings = [p["embedding"] for p in products]
    similarities = cosine_similarity(query_embedding, product_embeddings)[0]

    keyword_matches = []
    others = []

    for product, semantic_score in zip(products, similarities):
        title = product.get("title", "")
        description = product.get("description", "")
        price = product.get("price", 0.0)

        entry = {
            "title": title,
            "description": description,
            "price": price,
            "match": f"{round(semantic_score * 100, 2)}%",
            "score": round(semantic_score, 4)
        }

        if query_lower in title.lower():
            keyword_matches.append(entry)
        else:
            others.append(entry)

    keyword_matches.sort(key=lambda x: x["score"], reverse=True)
    others.sort(key=lambda x: x["score"], reverse=True)

    final_results = keyword_matches + others
    return final_results[:10]

@app.post("/image-to-caption")
async def image_to_caption(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    caption = generate_caption(file_path)
    return {"caption": caption}
