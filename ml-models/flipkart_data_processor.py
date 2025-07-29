import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset
import json
import re
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import warnings
warnings.filterwarnings('ignore')

class FlipkartDataProcessor:
    def __init__(self, csv_path, max_users=5000, max_items=None):
        self.csv_path = csv_path
        self.max_users = max_users
        self.max_items = max_items
        
        # Cache file paths
        self.users_cache_path = f"cached_users_{max_users}.csv"
        self.interactions_cache_path = f"cached_interactions_{max_users}.csv"
        
        # Initialize encoders
        self.user_id_encoder = LabelEncoder()
        self.item_id_encoder = LabelEncoder()
        self.category_encoder = LabelEncoder()
        self.brand_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
        # Load and process data
        self.load_flipkart_data()
        self.load_or_create_user_profiles()
        self.load_or_create_interactions()
        
    def load_flipkart_data(self):
        """Load and preprocess Flipkart product data"""
        print("Loading Flipkart dataset...")
        df = pd.read_csv(self.csv_path)
        
        # Clean and process data
        df = df.dropna(subset=['product_name', 'pid'])
        
        if self.max_items:
            df = df.head(self.max_items)
            
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
        
        # Create price bins for user preferences
        df['price_bin'] = pd.qcut(df['price'].dropna(), q=5, labels=['very_low', 'low', 'medium', 'high', 'very_high'])
        
        self.products_df = df
        print(f"Loaded {len(df)} products across {df['main_category'].nunique()} categories")
        
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
    
    def load_or_create_user_profiles(self):
        """Load user profiles from cache or generate new ones if cache doesn't exist"""
        import os
        
        if os.path.exists(self.users_cache_path):
            print(f"Loading user profiles from cache: {self.users_cache_path}")
            try:
                self.users_df = pd.read_csv(self.users_cache_path)
                # Convert string lists back to actual lists
                self.users_df['favorite_categories'] = self.users_df['favorite_categories'].apply(eval)
                self.users_df['preferred_brands'] = self.users_df['preferred_brands'].apply(eval)
                print(f"Loaded {len(self.users_df)} user profiles from cache")
                return
            except Exception as e:
                print(f"Error loading user cache: {e}. Regenerating...")
        
        print("Generating new user profiles...")
        self.create_user_profiles()
        
        # Save to cache
        cache_df = self.users_df.copy()
        # Convert lists to strings for CSV storage
        cache_df['favorite_categories'] = cache_df['favorite_categories'].astype(str)
        cache_df['preferred_brands'] = cache_df['preferred_brands'].astype(str)
        cache_df.to_csv(self.users_cache_path, index=False)
        print(f"User profiles saved to cache: {self.users_cache_path}")

    def create_user_profiles(self):
        """Generate realistic user profiles based on product data"""
        np.random.seed(42)
        
        # Get unique categories and brands for preference generation
        categories = self.products_df['main_category'].unique()
        brands = self.products_df['brand'].unique()
        
        users_data = []
        for user_id in range(self.max_users):
            # Demographics
            age = np.random.randint(18, 65)
            gender = np.random.choice(['M', 'F'])
            location = np.random.choice(['metro', 'tier1', 'tier2', 'tier3'])
            income_level = np.random.choice(['low', 'medium', 'high'], p=[0.3, 0.5, 0.2])
            
            # Preferences (users prefer 1-3 main categories)
            num_pref_cats = np.random.randint(1, 4)
            favorite_categories = list(np.random.choice(categories, num_pref_cats, replace=False))
            
            # Brand affinity (users prefer 0-5 brands)
            num_pref_brands = np.random.randint(0, 6)
            preferred_brands = list(np.random.choice(brands, min(num_pref_brands, len(brands)), replace=False))
            
            # Price sensitivity based on income
            price_sensitivity_map = {'low': 'high', 'medium': 'medium', 'high': 'low'}
            price_sensitivity = price_sensitivity_map[income_level]
            
            # Behavioral patterns
            avg_rating_given = np.random.normal(3.5, 0.8)
            avg_rating_given = max(1.0, min(5.0, avg_rating_given))
            
            purchase_frequency = np.random.choice(['low', 'medium', 'high'], p=[0.4, 0.4, 0.2])
            
            users_data.append({
                'user_id': user_id,
                'age': age,
                'gender': gender,
                'location': location,
                'income_level': income_level,
                'favorite_categories': favorite_categories,
                'preferred_brands': preferred_brands,
                'price_sensitivity': price_sensitivity,
                'avg_rating_given': avg_rating_given,
                'purchase_frequency': purchase_frequency
            })
        
        self.users_df = pd.DataFrame(users_data)
        print(f"Generated {len(self.users_df)} user profiles")
    
    def load_or_create_interactions(self):
        """Load interactions from cache or generate new ones if cache doesn't exist"""
        import os
        
        if os.path.exists(self.interactions_cache_path):
            print(f"Loading interactions from cache: {self.interactions_cache_path}")
            try:
                self.interactions_df = pd.read_csv(self.interactions_cache_path)
                print(f"Loaded {len(self.interactions_df)} interactions from cache")
                print(f"Click rate: {self.interactions_df['clicked'].mean():.3f}")
                print(f"Purchase rate: {self.interactions_df['purchased'].mean():.3f}")
                return
            except Exception as e:
                print(f"Error loading interactions cache: {e}. Regenerating...")
        
        print("Generating new interactions...")
        self.generate_interactions()
        
        # Save to cache
        self.interactions_df.to_csv(self.interactions_cache_path, index=False)
        print(f"Interactions saved to cache: {self.interactions_cache_path}")

    def generate_interactions(self):
        """Generate realistic user-item interactions"""
        np.random.seed(42)
        interactions = []
        
        # Generate interactions for each user
        for _, user in self.users_df.iterrows():
            user_id = user['user_id']
            
            # Determine number of interactions based on purchase frequency
            freq_map = {'low': (5, 15), 'medium': (15, 35), 'high': (35, 70)}
            min_interactions, max_interactions = freq_map[user['purchase_frequency']]
            num_interactions = np.random.randint(min_interactions, max_interactions + 1)
            
            # Filter products based on user preferences
            relevant_products = self.get_relevant_products_for_user(user)
            
            if len(relevant_products) == 0:
                relevant_products = self.products_df.sample(min(50, len(self.products_df)))
            
            # Sample products for this user
            sample_size = min(num_interactions, len(relevant_products))
            user_products = relevant_products.sample(sample_size)
            
            for idx, (_, product) in enumerate(user_products.iterrows()):
                # Generate engagement signals
                click_prob = self.calculate_click_probability(user, product)
                clicked = np.random.random() < click_prob
                
                if clicked:
                    purchase_prob = self.calculate_purchase_probability(user, product)
                    purchased = np.random.random() < purchase_prob
                    
                    # Rating given only if purchased
                    if purchased:
                        rating = np.random.normal(user['avg_rating_given'], 0.5)
                        rating = max(1.0, min(5.0, rating))
                    else:
                        rating = 0.0
                    
                    # Position in search results (earlier interactions get better positions)
                    position = min(idx + np.random.randint(0, 5), 50)
                    
                    interactions.append({
                        'user_id': user_id,
                        'item_id': product['pid'],
                        'clicked': 1.0 if clicked else 0.0,
                        'purchased': 1.0 if purchased else 0.0,
                        'rating': rating,
                        'position': position
                    })
        
        self.interactions_df = pd.DataFrame(interactions)
        print(f"Generated {len(self.interactions_df)} interactions")
        print(f"Click rate: {self.interactions_df['clicked'].mean():.3f}")
        print(f"Purchase rate: {self.interactions_df['purchased'].mean():.3f}")
    
    def get_relevant_products_for_user(self, user):
        """Get products relevant to a user based on preferences"""
        relevant_mask = pd.Series([False] * len(self.products_df))
        
        # Category preference
        if user['favorite_categories']:
            cat_mask = self.products_df['main_category'].isin(user['favorite_categories'])
            relevant_mask |= cat_mask
        
        # Brand preference
        if user['preferred_brands']:
            brand_mask = self.products_df['brand'].isin(user['preferred_brands'])
            relevant_mask |= brand_mask
        
        # Price sensitivity
        if user['price_sensitivity'] == 'high':  # Price sensitive users prefer discounts
            price_mask = (self.products_df['discounted_price'] < self.products_df['retail_price'])
            relevant_mask |= price_mask
        
        # Add some random products to ensure diversity
        random_mask = np.random.random(len(self.products_df)) < 0.1
        relevant_mask |= random_mask
        
        return self.products_df[relevant_mask]
    
    def calculate_click_probability(self, user, product):
        """Calculate probability of user clicking on product"""
        base_prob = 0.1
        
        # Category match
        if product['main_category'] in user['favorite_categories']:
            base_prob += 0.3
        
        # Brand match
        if product['brand'] in user['preferred_brands']:
            base_prob += 0.2
        
        # Rating influence
        if product['rating'] > 4.0:
            base_prob += 0.15
        
        # Price influence based on sensitivity
        if user['price_sensitivity'] == 'high':
            if pd.notna(product['discounted_price']) and product['discounted_price'] < product['retail_price']:
                base_prob += 0.1
        
        return min(base_prob, 0.8)
    
    def calculate_purchase_probability(self, user, product):
        """Calculate probability of user purchasing after clicking"""
        base_prob = 0.15
        
        # Strong category preference
        if product['main_category'] in user['favorite_categories']:
            base_prob += 0.25
        
        # Brand loyalty
        if product['brand'] in user['preferred_brands']:
            base_prob += 0.2
        
        # High rating products
        if product['rating'] > 4.0:
            base_prob += 0.15
        
        # Price consideration
        if user['income_level'] == 'high' or (
            user['price_sensitivity'] == 'high' and 
            pd.notna(product['discounted_price']) and 
            product['discounted_price'] < product['retail_price']
        ):
            base_prob += 0.1
        
        return min(base_prob, 0.7)
    
    def clear_cache(self):
        """Clear cached user and interaction files"""
        import os
        
        files_to_remove = [self.users_cache_path, self.interactions_cache_path]
        for file_path in files_to_remove:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed cache file: {file_path}")
            else:
                print(f"Cache file not found: {file_path}")
    
    def create_model_features(self):
        """Create features for twin tower model"""
        print("Creating model features...")
        
        # Encode categorical variables
        self.products_df['category_encoded'] = self.category_encoder.fit_transform(self.products_df['main_category'])
        self.products_df['brand_encoded'] = self.brand_encoder.fit_transform(self.products_df['brand'])
        
        # Create item ID mapping
        unique_item_ids = self.products_df['pid'].unique()
        self.item_id_encoder.fit(unique_item_ids)
        self.products_df['item_id_mapped'] = self.item_id_encoder.transform(self.products_df['pid'])
        
        # Create user ID mapping
        self.users_df['user_id_mapped'] = self.user_id_encoder.fit_transform(self.users_df['user_id'])
        
        # Create user features
        user_features = []
        for _, user in self.users_df.iterrows():
            features = [
                user['age'] / 100.0,  # Normalized age
                1.0 if user['gender'] == 'M' else 0.0,
                {'metro': 1.0, 'tier1': 0.75, 'tier2': 0.5, 'tier3': 0.25}[user['location']],
                {'low': 0.3, 'medium': 0.6, 'high': 1.0}[user['income_level']],
                {'high': 1.0, 'medium': 0.5, 'low': 0.0}[user['price_sensitivity']],
                user['avg_rating_given'] / 5.0,  # Normalized rating
                {'low': 0.3, 'medium': 0.6, 'high': 1.0}[user['purchase_frequency']]
            ]
            user_features.append(features)
        
        self.user_features = np.array(user_features, dtype=np.float32)
        
        # Create item features
        item_features = []
        for _, product in self.products_df.iterrows():
            features = [
                (product['price'] / self.products_df['price'].max()) if pd.notna(product['price']) else 0.5,
                product['rating'] / 5.0,  # Normalized rating
                product['category_encoded'] / self.products_df['category_encoded'].max(),
                product['brand_encoded'] / self.products_df['brand_encoded'].max(),
                1.0 if pd.notna(product['discounted_price']) and product['discounted_price'] < product['retail_price'] else 0.0
            ]
            item_features.append(features)
        
        self.item_features = np.array(item_features, dtype=np.float32)
        
        # Map interactions to encoded IDs
        self.interactions_df['user_id_mapped'] = self.interactions_df['user_id'].map(
            dict(zip(self.users_df['user_id'], self.users_df['user_id_mapped']))
        )
        self.interactions_df['item_id_mapped'] = self.interactions_df['item_id'].map(
            dict(zip(self.products_df['pid'], self.products_df['item_id_mapped']))
        )
        
        # Create user history
        self.create_user_history()
        
        print("Model features created successfully!")
        print(f"User features shape: {self.user_features.shape}")
        print(f"Item features shape: {self.item_features.shape}")
    
    def create_user_history(self, max_history_length=20):
        """Create user interaction history for each user"""
        self.user_histories = {}
        
        for user_id in self.users_df['user_id_mapped']:
            user_interactions = self.interactions_df[
                self.interactions_df['user_id_mapped'] == user_id
            ].sort_values('position')
            
            # Get purchased items as history
            purchased_items = user_interactions[user_interactions['purchased'] > 0]['item_id_mapped'].tolist()
            
            # Pad or truncate to max_history_length
            if len(purchased_items) > max_history_length:
                purchased_items = purchased_items[-max_history_length:]
            else:
                purchased_items = purchased_items + [0] * (max_history_length - len(purchased_items))
            
            self.user_histories[user_id] = purchased_items
    
    def get_model_data(self):
        """Get data in format suitable for twin tower model"""
        return {
            'num_users': len(self.users_df),
            'num_items': len(self.products_df),
            'user_features': self.user_features,
            'item_features': self.item_features,
            'user_histories': self.user_histories,
            'interactions': self.interactions_df,
            'user_id_encoder': self.user_id_encoder,
            'item_id_encoder': self.item_id_encoder,
            'products_df': self.products_df,
            'users_df': self.users_df
        }

class FlipkartDataset(Dataset):
    """PyTorch Dataset for Flipkart twin tower model"""
    
    def __init__(self, interactions_df, user_features, item_features, user_histories, history_length=20):
        self.interactions = interactions_df
        self.user_features = user_features
        self.item_features = item_features
        self.user_histories = user_histories
        self.history_length = history_length
        
    def __len__(self):
        return len(self.interactions)
    
    def __getitem__(self, idx):
        interaction = self.interactions.iloc[idx]
        
        user_id = int(interaction['user_id_mapped'])
        item_id = int(interaction['item_id_mapped'])
        
        # Get user features
        user_feat = torch.tensor(self.user_features[user_id], dtype=torch.float32)
        
        # Get item features
        item_feat = torch.tensor(self.item_features[item_id], dtype=torch.float32)
        
        # Get user history
        history = self.user_histories.get(user_id, [0] * self.history_length)
        user_history = torch.tensor(history, dtype=torch.long)
        
        # Create labels (multi-task: click, purchase)
        labels = torch.tensor([
            interaction['clicked'],
            interaction['purchased']
        ], dtype=torch.float32)
        
        # Position
        position = torch.tensor(interaction['position'], dtype=torch.long)
        
        return {
            'user_ids': torch.tensor(user_id, dtype=torch.long),
            'user_features': user_feat,
            'user_history': user_history,
            'item_ids': torch.tensor(item_id, dtype=torch.long),
            'item_features': item_feat,
            'positions': position,
            'labels': labels
        }

# Example usage
if __name__ == "__main__":
    # Initialize processor (will use cache if available)
    processor = FlipkartDataProcessor('flipkart_com-ecommerce_sample.csv', max_users=1000)
    
    # Optional: Clear cache and regenerate data
    # processor.clear_cache()
    # processor.load_or_create_user_profiles()
    # processor.load_or_create_interactions()
    
    # Create model features
    processor.create_model_features()
    
    # Get data for model
    model_data = processor.get_model_data()
    
    print(f"Dataset ready with {model_data['num_users']} users and {model_data['num_items']} items")
    print(f"Total interactions: {len(model_data['interactions'])}")
    print(f"Cache files: {processor.users_cache_path}, {processor.interactions_cache_path}")