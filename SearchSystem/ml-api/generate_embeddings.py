import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

with open("products.json", "r") as f:
    products = json.load(f)

for product in products:
    text = f"{product['title']} {product['description']}"
    embedding = model.encode(text).tolist()
    product["embedding"] = embedding

with open("products.json", "w") as f:
    json.dump(products, f, indent=2)
