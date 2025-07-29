#!/usr/bin/env python3
"""
Generate unified product data with embeddings from CSV source.
This script processes the Flipkart CSV data and creates a unified JSON format
with embeddings for semantic search and recommendations.
"""

import pandas as pd
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import ast
from tqdm import tqdm
import os

def clean_and_extract_text(row):
    """Extract clean text for embedding generation."""
    title = str(row.get('product_name', ''))
    description = str(row.get('description', ''))
    category = str(row.get('product_category_tree', ''))
    brand = str(row.get('brand', ''))
    
    # Clean the category tree (remove brackets and quotes)
    try:
        if category.startswith('[') and category.endswith(']'):
            category_list = ast.literal_eval(category)
            category = ' >> '.join(category_list) if isinstance(category_list, list) else str(category_list)
    except:
        pass
    
    # Combine all text for embedding
    combined_text = f"{title}. {description}. Category: {category}. Brand: {brand}"
    
    # Clean up the text
    combined_text = combined_text.replace('nan', '').replace('None', '')
    combined_text = ' '.join(combined_text.split())  # Remove extra whitespaces
    
    return combined_text

def extract_image_url(image_str):
    """Extract the first image URL from the image array string."""
    try:
        if pd.isna(image_str) or image_str == 'nan':
            return ""
        
        # Parse the JSON-like array string
        image_list = ast.literal_eval(str(image_str))
        if isinstance(image_list, list) and len(image_list) > 0:
            return image_list[0]
        elif isinstance(image_list, str):
            return image_list
    except:
        pass
    
    return ""

def safe_float(value):
    """Safely convert value to float."""
    try:
        if pd.isna(value) or str(value) == 'nan' or str(value) == '':
            return 0.0
        return float(value)
    except:
        return 0.0

def main():
    print("🚀 Generating unified product data with embeddings...")
    
    # Load CSV data
    csv_path = 'flipkart_com-ecommerce_sample.csv'
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found!")
        return
    
    print("📂 Loading CSV data...")
    df = pd.read_csv(csv_path)
    print(f"📊 Loaded {len(df)} products from CSV")
    
    # Initialize the sentence transformer model
    print("🤖 Loading SentenceTransformer model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Process data and generate embeddings
    unified_products = []
    
    print("⚙️ Processing products and generating embeddings...")
    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        try:
            # Extract and clean data
            text_for_embedding = clean_and_extract_text(row)
            
            # Generate embedding
            embedding = model.encode(text_for_embedding, convert_to_tensor=False).tolist()
            
            # Create unified product structure
            product = {
                "id": str(row.get('uniq_id', f"product_{idx}")),
                "pid": str(row.get('pid', '')),
                "title": str(row.get('product_name', '')),
                "description": str(row.get('description', '')),
                "category": str(row.get('product_category_tree', '')),
                "brand": str(row.get('brand', '')),
                "retail_price": safe_float(row.get('retail_price')),
                "discounted_price": safe_float(row.get('discounted_price')),
                "rating": str(row.get('product_rating', 'No rating available')),
                "overall_rating": str(row.get('overall_rating', 'No rating available')),
                "image": extract_image_url(row.get('image')),
                "product_url": str(row.get('product_url', '')),
                "is_fk_advantage": bool(row.get('is_FK_Advantage_product', False)),
                "specifications": str(row.get('product_specifications', '')),
                "embedding": embedding
            }
            
            # Clean up any 'nan' strings
            for key, value in product.items():
                if key != 'embedding' and isinstance(value, str) and value == 'nan':
                    product[key] = ''
            
            unified_products.append(product)
            
        except Exception as e:
            print(f"⚠️ Warning: Error processing row {idx}: {e}")
            continue
    
    print(f"✅ Successfully processed {len(unified_products)} products")
    
    # Save unified products to JSON
    output_file = 'unified_products.json'
    print(f"💾 Saving unified products to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unified_products, f, indent=2, ensure_ascii=False)
    
    print(f"🎉 Successfully saved {len(unified_products)} products with embeddings!")
    
    # Generate summary statistics
    print("\n📈 Data Summary:")
    print(f"Total products: {len(unified_products)}")
    print(f"Products with images: {sum(1 for p in unified_products if p['image'])}")
    print(f"Products with ratings: {sum(1 for p in unified_products if p['rating'] != 'No rating available')}")
    print(f"Unique brands: {len(set(p['brand'] for p in unified_products if p['brand']))}")
    
    # Show file size
    file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
    print(f"Output file size: {file_size:.1f} MB")
    
    print("\n🔧 Next steps:")
    print("1. Update main.py to use unified_products.json")
    print("2. Test semantic search with the new data")
    print("3. Update frontend to handle new product structure")

if __name__ == "__main__":
    main()