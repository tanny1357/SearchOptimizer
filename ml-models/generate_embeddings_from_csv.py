#!/usr/bin/env python3
"""
Generate embeddings for products from Flipkart CSV data
Creates a comprehensive products.json file with embeddings for semantic search
"""

import pandas as pd
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

class FlipkartEmbeddingGenerator:
    def __init__(self, csv_path, output_path="products_with_embeddings.json", max_products=None):
        self.csv_path = csv_path
        self.output_path = output_path
        self.max_products = max_products
        
        # Initialize sentence transformer model
        print("Loading sentence transformer model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded successfully!")
        
    def load_and_clean_data(self):
        """Load and clean the Flipkart CSV data"""
        print(f"Loading data from {self.csv_path}...")
        df = pd.read_csv(self.csv_path)
        print(f"Loaded {len(df)} products from CSV")
        
        # Clean and filter data
        df = df.dropna(subset=['product_name', 'pid'])
        
        if self.max_products:
            df = df.head(self.max_products)
            print(f"Limited to {self.max_products} products for processing")
        
        # Extract main category from category tree
        df['main_category'] = df['product_category_tree'].apply(self.extract_main_category)
        
        # Clean prices
        df['retail_price'] = pd.to_numeric(df['retail_price'], errors='coerce')
        df['discounted_price'] = pd.to_numeric(df['discounted_price'], errors='coerce')
        df['price'] = df['discounted_price'].fillna(df['retail_price'])
        
        # Clean ratings
        df['rating'] = df['overall_rating'].apply(self.clean_rating)
        
        # Clean brand
        df['brand'] = df['brand'].fillna('Unknown')
        
        # Clean description
        df['description'] = df['description'].fillna('')
        
        self.df = df
        print(f"Cleaned data: {len(df)} products")
        return df
    
    def extract_main_category(self, category_tree_str):
        """Extract main category from category tree"""
        try:
            if pd.isna(category_tree_str):
                return 'Unknown'
            # Parse the category tree string
            categories = eval(category_tree_str)[0].split(' >> ')
            return categories[0] if categories else 'Unknown'
        except:
            return 'Unknown'
    
    def clean_rating(self, rating_str):
        """Clean rating values"""
        if pd.isna(rating_str) or rating_str == 'No rating available':
            return 3.0  # Default neutral rating
        try:
            return float(rating_str)
        except:
            return 3.0
    
    def create_searchable_text(self, row):
        """Create comprehensive text for embedding generation"""
        parts = []
        
        # Product name (most important)
        if pd.notna(row['product_name']):
            parts.append(row['product_name'])
        
        # Brand
        if pd.notna(row['brand']) and row['brand'] != 'Unknown':
            parts.append(f"Brand: {row['brand']}")
        
        # Category
        if pd.notna(row['main_category']) and row['main_category'] != 'Unknown':
            parts.append(f"Category: {row['main_category']}")
        
        # Description (truncated to avoid overwhelming the embedding)
        if pd.notna(row['description']) and row['description']:
            desc = str(row['description'])[:500]  # Limit description length
            # Clean description text
            desc = desc.replace('Key Features of', '').replace('Specifications of', '')
            parts.append(desc)
        
        return ' '.join(parts)
    
    def generate_embeddings(self, batch_size=32):
        """Generate embeddings for all products"""
        print("Creating searchable text for products...")
        texts = []
        
        for _, row in tqdm(self.df.iterrows(), total=len(self.df), desc="Processing text"):
            searchable_text = self.create_searchable_text(row)
            texts.append(searchable_text)
        
        print(f"Generating embeddings for {len(texts)} products...")
        
        # Generate embeddings in batches
        all_embeddings = []
        for i in tqdm(range(0, len(texts), batch_size), desc="Generating embeddings"):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch_texts, convert_to_tensor=False)
            all_embeddings.extend(batch_embeddings)
        
        return all_embeddings
    
    def create_products_json(self, embeddings):
        """Create the final products JSON file"""
        print("Creating products JSON with embeddings...")
        
        products = []
        for idx, (_, row) in enumerate(tqdm(self.df.iterrows(), total=len(self.df), desc="Building JSON")):
            product = {
                # Basic info for search
                "title": str(row['product_name']),
                "description": str(row['description'])[:200] + "..." if len(str(row['description'])) > 200 else str(row['description']),
                "embedding": embeddings[idx].tolist(),
                
                # Detailed product information
                "product_details": {
                    "pid": str(row['pid']),
                    "brand": str(row['brand']),
                    "main_category": str(row['main_category']),
                    "price": float(row['price']) if pd.notna(row['price']) else 0.0,
                    "retail_price": float(row['retail_price']) if pd.notna(row['retail_price']) else 0.0,
                    "discounted_price": float(row['discounted_price']) if pd.notna(row['discounted_price']) else None,
                    "rating": float(row['rating']),
                    "product_url": str(row['product_url']) if pd.notna(row['product_url']) else "",
                    "is_FK_Advantage_product": bool(row['is_FK_Advantage_product']) if pd.notna(row['is_FK_Advantage_product']) else False,
                }
            }
            
            # Add images if available
            if pd.notna(row['image']):
                try:
                    images = eval(row['image'])
                    product["product_details"]["images"] = images
                except:
                    product["product_details"]["images"] = []
            else:
                product["product_details"]["images"] = []
            
            products.append(product)
        
        return products
    
    def save_products(self, products):
        """Save products to JSON file"""
        print(f"Saving {len(products)} products to {self.output_path}...")
        
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully saved products to {self.output_path}")
        
        # Print statistics
        print(f"\n📊 Statistics:")
        print(f"Total products: {len(products)}")
        print(f"Unique brands: {len(set(p['product_details']['brand'] for p in products))}")
        print(f"Unique categories: {len(set(p['product_details']['main_category'] for p in products))}")
        print(f"Average price: ₹{np.mean([p['product_details']['price'] for p in products if p['product_details']['price'] > 0]):.2f}")
        print(f"File size: {os.path.getsize(self.output_path) / (1024*1024):.1f} MB")
    
    def run(self):
        """Run the complete embedding generation process"""
        print("🚀 Starting Flipkart embedding generation process...")
        
        # Load and clean data
        self.load_and_clean_data()
        
        # Generate embeddings
        embeddings = self.generate_embeddings()
        
        # Create products JSON
        products = self.create_products_json(embeddings)
        
        # Save to file
        self.save_products(products)
        
        print("🎉 Embedding generation completed successfully!")
        return self.output_path

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate embeddings for Flipkart products')
    parser.add_argument('--csv', default='flipkart_com-ecommerce_sample.csv', 
                       help='Path to input CSV file')
    parser.add_argument('--output', default='products_with_embeddings.json',
                       help='Path to output JSON file')
    parser.add_argument('--max-products', type=int, default=None,
                       help='Maximum number of products to process (for testing)')
    
    args = parser.parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.csv):
        print(f"❌ Error: Input file {args.csv} not found!")
        return
    
    # Generate embeddings
    generator = FlipkartEmbeddingGenerator(
        csv_path=args.csv,
        output_path=args.output,
        max_products=args.max_products
    )
    
    output_file = generator.run()
    print(f"✅ Done! Output saved to: {output_file}")

if __name__ == "__main__":
    main()