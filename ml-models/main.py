from fastapi import FastAPI, Request, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import torch
import numpy as np
import pandas as pd
import json
import shutil
import sys
import os
from pathlib import Path

# Import local modules
from spell_correction import get_corrected_query
from caption_image import generate_caption

# Add src directory to path for two-tower model
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from flipkart_two_tower import FlipkartTwoTower
    from flipkart_data_processor import FlipkartDataProcessor
    TWO_TOWER_AVAILABLE = True
except ImportError:
    TWO_TOWER_AVAILABLE = False
    print("⚠️  Two-tower model not available. Recommendation endpoints will be disabled.")

# Pydantic models for API requests/responses
class UserProfile(BaseModel):
    user_id: int = Field(..., description="User ID")
    age: Optional[int] = Field(None, description="User age")
    gender: Optional[str] = Field(None, description="User gender")
    location: Optional[str] = Field(None, description="User location")
    income_level: Optional[str] = Field(None, description="User income level")
    favorite_categories: Optional[List[str]] = Field(None, description="Favorite categories")
    preferred_brands: Optional[List[str]] = Field(None, description="Preferred brands")

class RecommendationRequest(BaseModel):
    user_id: int = Field(..., description="User ID for recommendations")
    top_k: int = Field(20, description="Number of recommendations to return", ge=1, le=50)

class InteractionRequest(BaseModel):
    user_id: int = Field(..., description="User ID")
    item_id: int = Field(..., description="Item ID")

class SimilarItemsRequest(BaseModel):
    item_id: int = Field(..., description="Item ID to find similar items for")
    top_k: int = Field(20, description="Number of similar items to return", ge=1, le=50)

class Recommendation(BaseModel):
    rank: int
    product_name: str
    brand: str
    category: str
    price: float
    rating: float
    similarity_score: float

class InteractionPrediction(BaseModel):
    click_probability: float
    purchase_probability: float

class SimilarItem(BaseModel):
    rank: int
    product_name: str
    brand: str
    category: str
    price: float
    rating: float
    similarity_score: float

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# FastAPI app
app = FastAPI(
    title="Unified Search & Recommendation API",
    description="Unified API for search optimization, spell correction, image captioning, and personalized recommendations",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FlipkartPredictor:
    """Enhanced predictor class for API integration"""
    
    def __init__(self, model_path: str, csv_path: str, device: str = 'auto'):
        if not TWO_TOWER_AVAILABLE:
            raise RuntimeError("Two-tower model dependencies not available")
            
        # Set device
        if device == 'auto':
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
        
        # Load model
        self.load_model(model_path)
        
        # Load data processor (for feature extraction)
        self.processor = FlipkartDataProcessor(csv_path, max_users=1000)
        self.processor.create_model_features()
        self.model_data = self.processor.get_model_data()
        
    def load_model(self, model_path: str):
        """Load trained model"""
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        
        # Get model arguments
        model_args = checkpoint['args']
        model_data = checkpoint['model_data']
        
        # Initialize model
        self.model = FlipkartTwoTower(
            user_id_hash_size=model_data['num_users'],
            item_id_hash_size=model_data['num_items'],
            embedding_dim=model_args['embedding_dim'],
            user_feature_dim=model_args['user_feature_dim'],
            item_feature_dim=model_args['item_feature_dim'],
            user_history_seqlen=model_args['user_history_seqlen'],
            num_items_to_return=model_args['num_items_to_return']
        ).to(self.device)
        
        # Load state dict
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
    def get_user_info(self, user_id: int) -> Dict[str, Any]:
        """Get user profile information"""
        if user_id >= len(self.model_data['users_df']):
            raise ValueError(f"User ID {user_id} out of range. Max: {len(self.model_data['users_df']) - 1}")
        
        user_data = self.model_data['users_df'].iloc[user_id]
        return {
            'user_id': user_id,
            'age': int(user_data['age']),
            'gender': user_data['gender'],
            'location': user_data['location'],
            'income_level': user_data['income_level'],
            'favorite_categories': user_data['favorite_categories'],
            'preferred_brands': user_data['preferred_brands'],
            'price_sensitivity': user_data['price_sensitivity'],
            'purchase_frequency': user_data['purchase_frequency']
        }
    
    def get_recommendations(self, user_id: int, top_k: int = 20) -> List[Dict[str, Any]]:
        """Get top-k recommendations for a user"""
        if user_id >= len(self.model_data['users_df']):
            raise ValueError(f"User ID {user_id} out of range. Max: {len(self.model_data['users_df']) - 1}")
        
        with torch.no_grad():
            # Prepare user data
            user_id_tensor = torch.tensor([user_id], dtype=torch.long).to(self.device)
            user_features = torch.tensor([self.model_data['user_features'][user_id]], dtype=torch.float32).to(self.device)
            user_history = torch.tensor([self.model_data['user_histories'][user_id]], dtype=torch.long).to(self.device)
            
            # Get all item embeddings
            all_item_ids = torch.arange(self.model_data['num_items'], dtype=torch.long).to(self.device)
            all_item_features = torch.tensor(self.model_data['item_features'], dtype=torch.float32).to(self.device)
            
            # Get embeddings
            user_emb = self.model.get_user_embedding(user_id_tensor, user_features, user_history)
            item_embs = self.model.get_item_embedding(all_item_ids, all_item_features)
            
            # Calculate similarity scores
            scores = torch.mm(user_emb, item_embs.t()).squeeze(0)
            
            # Get top-k items
            top_k_scores, top_k_indices = torch.topk(scores, min(top_k, len(scores)))
            
            # Convert to CPU for processing
            top_k_indices = top_k_indices.cpu().numpy()
            top_k_scores = top_k_scores.cpu().numpy()
            
            # Get product information
            recommendations = []
            for i, (item_idx, score) in enumerate(zip(top_k_indices, top_k_scores)):
                product = self.model_data['products_df'].iloc[item_idx]
                
                recommendations.append({
                    'rank': i + 1,
                    'product_name': product['product_name'],
                    'brand': product['brand'],
                    'category': product['main_category'],
                    'price': float(product['price']) if pd.notna(product['price']) else 0.0,
                    'rating': float(product['rating']) if pd.notna(product['rating']) else 3.0,
                    'similarity_score': float(score)
                })
            
            return recommendations
    
    def predict_interaction(self, user_id: int, item_id: int) -> Dict[str, float]:
        """Predict interaction probability for a specific user-item pair"""
        if user_id >= len(self.model_data['users_df']):
            raise ValueError(f"User ID {user_id} out of range")
            
        if item_id >= len(self.model_data['products_df']):
            raise ValueError(f"Item ID {item_id} out of range")
        
        with torch.no_grad():
            # Prepare data
            user_id_tensor = torch.tensor([user_id], dtype=torch.long).to(self.device)
            user_features = torch.tensor([self.model_data['user_features'][user_id]], dtype=torch.float32).to(self.device)
            user_history = torch.tensor([self.model_data['user_histories'][user_id]], dtype=torch.long).to(self.device)
            
            item_id_tensor = torch.tensor([item_id], dtype=torch.long).to(self.device)
            item_features = torch.tensor([self.model_data['item_features'][item_id]], dtype=torch.float32).to(self.device)
            
            # Dummy position
            positions = torch.tensor([1], dtype=torch.long).to(self.device)
            
            # Get predictions
            outputs = self.model(
                user_ids=user_id_tensor,
                user_features=user_features,
                user_history=user_history,
                item_ids=item_id_tensor,
                item_features=item_features,
                positions=positions
            )
            
            click_prob = torch.sigmoid(outputs['click_logits']).item()
            purchase_prob = torch.sigmoid(outputs['purchase_logits']).item()
            
            return {
                'click_probability': float(click_prob),
                'purchase_probability': float(purchase_prob)
            }
    
    def get_similar_items(self, item_id: int, top_k: int = 20) -> List[Dict[str, Any]]:
        """Find items similar to a given item"""
        if item_id >= len(self.model_data['products_df']):
            raise ValueError(f"Item ID {item_id} out of range")
        
        with torch.no_grad():
            # Get all item embeddings
            all_item_ids = torch.arange(self.model_data['num_items'], dtype=torch.long).to(self.device)
            all_item_features = torch.tensor(self.model_data['item_features'], dtype=torch.float32).to(self.device)
            
            item_embs = self.model.get_item_embedding(all_item_ids, all_item_features)
            
            # Get target item embedding
            target_emb = item_embs[item_id].unsqueeze(0)
            
            # Calculate similarity with all items
            similarities = torch.mm(target_emb, item_embs.t()).squeeze(0)
            
            # Get top-k most similar (excluding the item itself)
            similarities[item_id] = -float('inf')  # Exclude self
            top_k_scores, top_k_indices = torch.topk(similarities, min(top_k, len(similarities)))
            
            # Convert to CPU
            top_k_indices = top_k_indices.cpu().numpy()
            top_k_scores = top_k_scores.cpu().numpy()
            
            # Get similar products
            similar_items = []
            for i, (similar_idx, score) in enumerate(zip(top_k_indices, top_k_scores)):
                product = self.model_data['products_df'].iloc[similar_idx]
                
                similar_items.append({
                    'rank': i + 1,
                    'product_name': product['product_name'],
                    'brand': product['brand'],
                    'category': product['main_category'],
                    'price': float(product['price']) if pd.notna(product['price']) else 0.0,
                    'rating': float(product['rating']) if pd.notna(product['rating']) else 3.0,
                    'similarity_score': float(score)
                })
            
            return similar_items

# Global instances
predictor = None
search_model = SentenceTransformer('all-MiniLM-L6-v2')
products = []
suggestion_bank = []

@app.on_event("startup")
async def startup_event():
    """Initialize services when the app starts"""
    global predictor, products, suggestion_bank
    
    # Load products for search functionality
    try:
        with open("unified_products.json", "r") as f:
            products = json.load(f)
        suggestion_bank = list({p["title"] for p in products})
        print(f"✅ Loaded {len(products)} unified products for search")
    except FileNotFoundError:
        print("⚠️  unified_products.json not found. Search functionality will be limited.")
        products = []
        suggestion_bank = []
    
    # Initialize two-tower predictor (optional)
    if TWO_TOWER_AVAILABLE:
        try:
            model_path = "flipkart_twin_tower.pt"
            csv_path = "flipkart_com-ecommerce_sample.csv"
            
            if os.path.exists(model_path) and os.path.exists(csv_path):
                predictor = FlipkartPredictor(model_path, csv_path)
                print("✅ Two-tower predictor initialized successfully!")
            else:
                print("⚠️  Two-tower model files not found. Recommendation endpoints will be disabled.")
        except Exception as e:
            print(f"⚠️  Failed to initialize two-tower predictor: {e}")

# API Endpoints

@app.get("/", response_model=APIResponse)
async def root():
    """Root endpoint with API information"""
    return APIResponse(
        success=True,
        message="Unified Search & Recommendation API is running!",
        data={
            "version": "2.0.0",
            "features": {
                "semantic_search": True,
                "spell_correction": True,
                "image_captioning": True,
                "two_tower_recommendations": predictor is not None,
                "total_products": len(products)
            },
            "total_users": len(predictor.model_data['users_df']) if predictor else 0,
            "total_products_in_model": len(predictor.model_data['products_df']) if predictor else 0
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running",
        "services": {
            "search": len(products) > 0,
            "spell_correction": True,
            "image_captioning": True,
            "recommendations": predictor is not None
        }
    }

# Search & Query Processing Endpoints

@app.post("/semantic-search")
async def semantic_search(request: Request):
    """Semantic search with keyword matching priority"""
    body = await request.json()
    query = body["query"]
    query_lower = query.lower()

    if not products:
        raise HTTPException(status_code=503, detail="Product database not available")

    query_embedding = search_model.encode([query])
    product_embeddings = [p["embedding"] for p in products]
    similarities = cosine_similarity(query_embedding, product_embeddings)[0]

    keyword_matches = []
    others = []

    for product, semantic_score in zip(products, similarities):
        title = product.get("title", "")
        description = product.get("description", "")
        discounted_price = product.get("discounted_price", 0.0)
        retail_price = product.get("retail_price", 0.0)
        brand = product.get("brand", "")
        category = product.get("category", "")
        image = product.get("image", "")
        rating = product.get("rating", "No rating available")

        entry = {
            "id": product.get("id", ""),
            "title": title,
            "description": description[:200] + "..." if len(description) > 200 else description,  # Limit description length
            "brand": brand,
            "category": category,
            "price": discounted_price if discounted_price > 0 else retail_price,
            "retail_price": retail_price,
            "discounted_price": discounted_price,
            "image": image,
            "rating": rating,
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
    return final_results[:20]

@app.get("/search")
async def search(query: str = Query(...), semantic: bool = Query(False)):
    """Search with suggestions and optional semantic search"""
    query = query.strip().lower()

    if not query:
        return {"suggestions": [], "results": []}

    if not products:
        return {"suggestions": [], "results": [], "error": "Product database not available"}

    suggestions = [s for s in suggestion_bank if query in s.lower()]
    suggestions = sorted(suggestions)[:6]

    if not semantic:
        return {"suggestions": suggestions}

    # Semantic search
    query_embedding = search_model.encode([query])
    product_embeddings = [p["embedding"] for p in products]
    similarities = cosine_similarity(query_embedding, product_embeddings)[0]

    scored_products = [
        {
            "id": p.get("id", ""),
            "title": p["title"], 
            "description": p["description"][:200] + "..." if len(p["description"]) > 200 else p["description"],
            "brand": p.get("brand", ""),
            "category": p.get("category", ""),
            "price": p.get("discounted_price", 0.0) if p.get("discounted_price", 0.0) > 0 else p.get("retail_price", 0.0),
            "retail_price": p.get("retail_price", 0.0),
            "discounted_price": p.get("discounted_price", 0.0),
            "image": p.get("image", ""),
            "rating": p.get("rating", "No rating available"),
            "score": float(score)
        }
        for p, score in zip(products, similarities)
    ]
    scored_products.sort(key=lambda x: x["score"], reverse=True)

    return {
        "suggestions": suggestions,
        "results": scored_products[:20]
    }

@app.get("/spell-correct")
async def spell_correct(query: str = Query(...)):
    """Spell correction for search queries"""
    correction = get_corrected_query(query)
    return {"correction": correction, "original": query}

@app.post("/image-to-caption")
async def image_to_caption(file: UploadFile = File(...)):
    """Generate caption from uploaded image"""
    try:
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        caption = generate_caption(file_path)
        
        # Clean up temporary file
        try:
            os.remove(file_path)
        except:
            pass
            
        return {"caption": caption, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

# Two-Tower Recommendation Endpoints (Optional)

@app.get("/user/{user_id}", response_model=APIResponse)
async def get_user_profile(user_id: int):
    """Get user profile information"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Recommendation service not available")
    
    try:
        user_info = predictor.get_user_info(user_id)
        return APIResponse(
            success=True,
            message=f"User profile retrieved for user {user_id}",
            data=user_info
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/recommendations", response_model=APIResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get product recommendations for a user"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Recommendation service not available")
    
    try:
        recommendations = predictor.get_recommendations(request.user_id, request.top_k)
        return APIResponse(
            success=True,
            message=f"Generated {len(recommendations)} recommendations for user {request.user_id}",
            data=recommendations
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/predict-interaction", response_model=APIResponse)
async def predict_interaction(request: InteractionRequest):
    """Predict interaction probability between a user and item"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Recommendation service not available")
    
    try:
        prediction = predictor.predict_interaction(request.user_id, request.item_id)
        return APIResponse(
            success=True,
            message=f"Interaction prediction for user {request.user_id} and item {request.item_id}",
            data=prediction
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/similar-items", response_model=APIResponse)
async def get_similar_items(request: SimilarItemsRequest):
    """Get items similar to a given item"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Recommendation service not available")
    
    try:
        similar_items = predictor.get_similar_items(request.item_id, request.top_k)
        return APIResponse(
            success=True,
            message=f"Found {len(similar_items)} similar items for item {request.item_id}",
            data=similar_items
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/stats", response_model=APIResponse)
async def get_statistics():
    """Get dataset and model statistics"""
    try:
        stats = {
            "search_products": len(products),
            "suggestion_bank_size": len(suggestion_bank),
            "services": {
                "semantic_search": len(products) > 0,
                "spell_correction": True,
                "image_captioning": True,
                "recommendations": predictor is not None
            }
        }
        
        if predictor:
            stats.update({
                "total_users": len(predictor.model_data['users_df']),
                "total_model_products": len(predictor.model_data['products_df']),
                "total_interactions": len(predictor.model_data['interactions']),
                "total_categories": predictor.model_data['products_df']['main_category'].nunique(),
                "total_brands": predictor.model_data['products_df']['brand'].nunique(),
                "model_parameters": sum(p.numel() for p in predictor.model.parameters()),
                "device": str(predictor.device)
            })
        
        return APIResponse(
            success=True,
            message="Service statistics",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)