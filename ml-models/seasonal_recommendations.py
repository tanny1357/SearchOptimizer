import pandas as pd
import numpy as np
from datetime import datetime
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional
import os

class SeasonalRecommendationSystem:
    """
    A system that provides seasonal product recommendations based on the current month
    and uses semantic search to find relevant products from the seasonal CSV data.
    """
    
    def __init__(self, csv_path: str = "Product,Month,Season.csv", model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the seasonal recommendation system.
        
        Args:
            csv_path: Path to the CSV file containing seasonal product data
            model_name: Name of the sentence transformer model to use
        """
        self.csv_path = csv_path
        self.model = SentenceTransformer(model_name)
        self.seasonal_data = None
        self.product_embeddings = None
        self._load_seasonal_data()
    
    def _load_seasonal_data(self):
        """Load seasonal product data from CSV and create embeddings."""
        try:
            if os.path.exists(self.csv_path):
                self.seasonal_data = pd.read_csv(self.csv_path)
                # Create embeddings for all products
                products = self.seasonal_data['Product'].tolist()
                self.product_embeddings = self.model.encode(products)
                print(f"✅ Loaded {len(self.seasonal_data)} seasonal products")
            else:
                print(f"⚠️  Seasonal data file not found: {self.csv_path}")
        except Exception as e:
            print(f"❌ Error loading seasonal data: {e}")
    
    def get_current_month_name(self) -> str:
        """Get the current month name."""
        return datetime.now().strftime("%B")
    
    def get_products_for_month(self, month: Optional[str] = None) -> List[str]:
        """
        Get all products for a specific month.
        
        Args:
            month: Month name (e.g., "January"). If None, uses current month.
            
        Returns:
            List of product names for the given month
        """
        if self.seasonal_data is None:
            return []
        
        if month is None:
            month = self.get_current_month_name()
        
        # Filter products for the given month
        month_products = self.seasonal_data[
            self.seasonal_data['Month'].str.lower() == month.lower()
        ]['Product'].tolist()
        
        return month_products
    
    def get_semantic_seasonal_recommendations(self, 
                                            search_query: str, 
                                            month: Optional[str] = None, 
                                            top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Get seasonal product recommendations based PURELY on season/month, ignoring search query.
        Returns the most relevant seasonal products for the current season.
        
        Args:
            search_query: IGNORED - seasonal recommendations are independent of search
            month: Month name (if None, uses current month)
            top_k: Number of recommendations to return
            
        Returns:
            List of seasonal product recommendations ranked by seasonal relevance
        """
        if self.seasonal_data is None or self.product_embeddings is None:
            return []
        
        if month is None:
            month = self.get_current_month_name()
        
        # Get products for the current month
        month_mask = self.seasonal_data['Month'].str.lower() == month.lower()
        month_products = self.seasonal_data[month_mask]
        
        if month_products.empty:
            return []
        
        # Pure seasonal recommendations - no search query influence
        season = self.get_season_for_month(month)
        
        # Create recommendations with seasonal priority scoring
        recommendations = []
        for idx, (orig_idx, product_row) in enumerate(month_products.iterrows()):
            product_name = product_row['Product'].lower()
            
            # Pure seasonal relevance scoring (NO SEARCH QUERY INFLUENCE)
            # 1. Base seasonal score (high for all seasonal products)
            base_seasonal_score = 0.9
            
            # 2. Month-specific boost (exact month match)
            month_boost = 0.05  # Small boost for being in the exact month
            
            # 3. Position-based boost (earlier entries in CSV get slight priority)
            position_boost = max(0, (len(month_products) - idx) / len(month_products) * 0.05)
            
            # Calculate final seasonal score (NO SEARCH QUERY INVOLVED)
            final_score = base_seasonal_score + month_boost + position_boost
            final_score = min(final_score, 1.0)  # Cap at 1.0
            
            recommendations.append({
                'product': product_row['Product'],
                'month': product_row['Month'],
                'season': product_row['Season'],
                'similarity_score': final_score,
                'csv_position': idx + 1,  # Track position in CSV
                'rank': idx + 1
            })
        
        # Sort by seasonal relevance score (highest first)
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Add percentage scores for display
        for rec in recommendations[:top_k]:
            rec['match_percentage'] = f"Seasonal {season}"
        
        return recommendations[:top_k]
    
    def get_popular_seasonal_products(self, 
                                    month: Optional[str] = None, 
                                    top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Get popular seasonal products for a month (fallback when no semantic matches).
        
        Args:
            month: Month name (if None, uses current month)
            top_k: Number of products to return
            
        Returns:
            List of popular seasonal products for the month
        """
        if self.seasonal_data is None:
            return []
        
        if month is None:
            month = self.get_current_month_name()
        
        # Get products for the current month
        month_products = self.seasonal_data[
            self.seasonal_data['Month'].str.lower() == month.lower()
        ]
        
        if month_products.empty:
            return []
        
        # Take a random sample or first N products as "popular"
        popular_products = []
        for idx, (_, row) in enumerate(month_products.head(top_k).iterrows()):
            popular_products.append({
                'product': row['Product'],
                'month': row['Month'],
                'season': row['Season'],
                'similarity_score': 0.5,  # Default score for popular items
                'match_percentage': "Popular",
                'rank': idx + 1,
                'is_fallback': True  # Flag to indicate this is a fallback recommendation
            })
        
        return popular_products
    
    def get_seasonal_recommendations_with_fallback(self, 
                                                 search_query: str, 
                                                 month: Optional[str] = None, 
                                                 top_k: int = 10,
                                                 min_similarity: float = 0.1) -> List[Dict[str, Any]]:
        """
        Get seasonal recommendations PURELY based on season/month - search query is IGNORED.
        
        Args:
            search_query: IGNORED - seasonal recommendations are independent of search
            month: Month name (if None, uses current month)
            top_k: Number of recommendations to return
            min_similarity: IGNORED - not used for pure seasonal recommendations
            
        Returns:
            List of seasonal recommendations based purely on season/month
        """
        # Get purely seasonal recommendations (ignore search query completely)
        seasonal_recommendations = self.get_semantic_seasonal_recommendations(
            search_query="",  # Empty query since we ignore it anyway
            month=month,
            top_k=top_k * 2  # Get more to have better selection
        )
        
        # All seasonal recommendations are valid (no similarity filtering needed)
        # Just take the top ones based on seasonal relevance
        for rec in seasonal_recommendations:
            rec['is_fallback'] = False
        
        return seasonal_recommendations[:top_k]
    
    def get_all_seasonal_products_for_month(self, month: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all seasonal products for a specific month with their details.
        
        Args:
            month: Month name (if None, uses current month)
            
        Returns:
            List of all seasonal products for the month
        """
        if self.seasonal_data is None:
            return []
        
        if month is None:
            month = self.get_current_month_name()
        
        month_products = self.seasonal_data[
            self.seasonal_data['Month'].str.lower() == month.lower()
        ]
        
        products = []
        for _, row in month_products.iterrows():
            products.append({
                'product': row['Product'],
                'month': row['Month'],
                'season': row['Season']
            })
        
        return products
    
    def get_season_for_month(self, month: Optional[str] = None) -> str:
        """
        Get the season for a given month.
        
        Args:
            month: Month name (if None, uses current month)
            
        Returns:
            Season name for the month
        """
        if self.seasonal_data is None:
            return "Unknown"
        
        if month is None:
            month = self.get_current_month_name()
        
        month_data = self.seasonal_data[
            self.seasonal_data['Month'].str.lower() == month.lower()
        ]
        
        if not month_data.empty:
            return month_data.iloc[0]['Season']
        
        return "Unknown"
