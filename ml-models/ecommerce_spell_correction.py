#!/usr/bin/env python3
"""
Professional E-commerce Spell Correction System
Combines multiple approaches for high-accuracy spell correction in e-commerce context.
"""

import json
import re
import os
from typing import List, Dict, Tuple, Optional, Set
from collections import Counter, defaultdict
import difflib
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import Levenshtein


class EcommerceSpellCorrector:
    """
    Professional spell correction system optimized for e-commerce queries.
    Combines statistical, phonetic, semantic, and domain-specific approaches.
    """
    
    def __init__(self, products_file: str = "unified_products.json"):
        self.products_file = products_file
        self.vocabulary = set()
        self.brand_names = set()
        self.product_names = set()
        self.category_terms = set()
        self.word_frequencies = Counter()
        self.bigrams = Counter()
        self.trigrams = Counter()
        
        # Common e-commerce abbreviations and expansions
        self.ecommerce_expansions = {
            'tv': 'television',
            'pc': 'computer',
            'mob': 'mobile',
            'tab': 'tablet',
            'cam': 'camera',
            'mic': 'microphone',
            'kbd': 'keyboard',
            'hdd': 'hard drive',
            'ssd': 'solid state drive',
            'ram': 'memory',
            'gpu': 'graphics card',
            'cpu': 'processor',
            'usb': 'universal serial bus',
            'hdmi': 'high definition multimedia interface',
            'wifi': 'wireless',
            'bt': 'bluetooth',
            'ac': 'air conditioner',
            'fridge': 'refrigerator',
            'washing': 'washing machine',
            'tshirt': 't-shirt',
            'jeans': 'denim',
            'sneakers': 'sports shoes',
            'earphones': 'headphones'
        }
        
        # Common e-commerce typos and corrections
        self.common_typos = {
            'iphone': ['iphone', 'ipone', 'iphon', 'ifone', 'iphones'],
            'samsung': ['samsung', 'samsnug', 'samsng', 'samung', 'samsong'],
            'adidas': ['adidas', 'addidas', 'adiadas', 'adidass'],
            'nike': ['nike', 'niike', 'nkie', 'nyke'],
            'laptop': ['laptop', 'laptpo', 'labtop', 'leptop'],
            'mobile': ['mobile', 'mobil', 'moble', 'moblie'],
            'headphones': ['headphones', 'hedphones', 'headfones', 'headphons'],
            'bluetooth': ['bluetooth', 'bluetoth', 'bluethooth', 'blutooth'],
            'wireless': ['wireless', 'wireles', 'wirelss', 'wirelees'],
            'camera': ['camera', 'camra', 'cemera', 'camara']
        }
        
        # Initialize semantic model for context-aware corrections
        try:
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            self.semantic_enabled = True
        except:
            self.semantic_enabled = False
            print("⚠️ Semantic model not available, using statistical methods only")
            
        self._load_vocabulary()
        self._build_correction_maps()
    
    def _load_vocabulary(self):
        """Load vocabulary from product data and build frequency maps."""
        if not os.path.exists(self.products_file):
            print(f"⚠️ Products file {self.products_file} not found")
            return
            
        with open(self.products_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        print(f"📚 Building vocabulary from {len(products)} products...")
        
        for product in products:
            # Extract and clean text
            title = product.get('title', '').lower()
            brand = product.get('brand', '').lower()
            category = product.get('category', '').lower()
            description = product.get('description', '').lower()
            
            # Process title
            title_words = self._tokenize(title)
            for word in title_words:
                if len(word) > 2:
                    self.vocabulary.add(word)
                    self.product_names.add(word)
                    self.word_frequencies[word] += 3  # Higher weight for title words
            
            # Process brand
            if brand and brand != 'nan':
                brand_words = self._tokenize(brand)
                for word in brand_words:
                    if len(word) > 1:
                        self.vocabulary.add(word)
                        self.brand_names.add(word)
                        self.word_frequencies[word] += 5  # Highest weight for brands
            
            # Process category
            if category and category != 'nan':
                category_words = self._tokenize(category)
                for word in category_words:
                    if len(word) > 2:
                        self.vocabulary.add(word)
                        self.category_terms.add(word)
                        self.word_frequencies[word] += 2
            
            # Process description (first 100 words only)
            desc_words = self._tokenize(description)[:100]
            for word in desc_words:
                if len(word) > 3:
                    self.vocabulary.add(word)
                    self.word_frequencies[word] += 1
        
        # Build n-grams for context-aware correction
        self._build_ngrams()
        
        print(f"✅ Built vocabulary: {len(self.vocabulary)} unique words")
        print(f"   - Brands: {len(self.brand_names)}")
        print(f"   - Product terms: {len(self.product_names)}")
        print(f"   - Category terms: {len(self.category_terms)}")
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into words, handling e-commerce specific cases."""
        if not text or text == 'nan':
            return []
        
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^\w\s-]', ' ', text)
        
        # Split on whitespace and hyphens
        words = re.split(r'[\s\-_]+', text.lower())
        
        # Filter out empty strings and very short words
        words = [w.strip() for w in words if w.strip() and len(w.strip()) > 1]
        
        return words
    
    def _build_ngrams(self):
        """Build bigram and trigram frequency maps."""
        all_words = list(self.word_frequencies.keys())
        
        # Build bigrams
        for i in range(len(all_words) - 1):
            bigram = (all_words[i], all_words[i + 1])
            self.bigrams[bigram] += 1
        
        # Build trigrams  
        for i in range(len(all_words) - 2):
            trigram = (all_words[i], all_words[i + 1], all_words[i + 2])
            self.trigrams[trigram] += 1
    
    def _build_correction_maps(self):
        """Build reverse lookup maps for common typos."""
        self.typo_to_correct = {}
        
        for correct_word, typos in self.common_typos.items():
            for typo in typos:
                self.typo_to_correct[typo.lower()] = correct_word
    
    def _get_edit_distance_candidates(self, word: str, max_distance: int = 2) -> List[Tuple[str, int]]:
        """Get candidates based on edit distance."""
        candidates = []
        word_lower = word.lower()
        
        for vocab_word in self.vocabulary:
            distance = Levenshtein.distance(word_lower, vocab_word)
            if distance <= max_distance:
                # Weight by frequency and distance
                score = self.word_frequencies[vocab_word] / (distance + 1)
                candidates.append((vocab_word, score))
        
        return sorted(candidates, key=lambda x: x[1], reverse=True)
    
    def _get_phonetic_candidates(self, word: str) -> List[str]:
        """Get candidates based on phonetic similarity."""
        candidates = []
        word_lower = word.lower()
        
        # Simple phonetic rules for common e-commerce terms
        phonetic_rules = [
            ('ph', 'f'), ('ck', 'k'), ('c', 'k'), ('z', 's'),
            ('i', 'y'), ('ei', 'ai'), ('ou', 'ow'), ('tion', 'shun')
        ]
        
        transformed = word_lower
        for old, new in phonetic_rules:
            transformed = transformed.replace(old, new)
        
        # Find vocabulary words that match the phonetically transformed word
        for vocab_word in self.vocabulary:
            vocab_transformed = vocab_word
            for old, new in phonetic_rules:
                vocab_transformed = vocab_transformed.replace(old, new)
            
            if Levenshtein.distance(transformed, vocab_transformed) <= 1:
                candidates.append(vocab_word)
        
        return candidates
    
    def _get_semantic_candidates(self, word: str, context: str = "") -> List[str]:
        """Get semantically similar candidates."""
        if not self.semantic_enabled:
            return []
        
        candidates = []
        query_text = f"{context} {word}".strip()
        
        try:
            query_embedding = self.semantic_model.encode([query_text])
            
            # Get embeddings for vocabulary subset (brands and product terms)
            priority_vocab = list(self.brand_names.union(self.product_names))[:1000]  # Limit for performance
            vocab_embeddings = self.semantic_model.encode(priority_vocab)
            
            # Calculate similarities
            similarities = cosine_similarity(query_embedding, vocab_embeddings)[0]
            
            # Get top similar words
            top_indices = np.argsort(similarities)[-10:][::-1]
            for idx in top_indices:
                if similarities[idx] > 0.7:  # High similarity threshold
                    candidates.append(priority_vocab[idx])
            
        except Exception as e:
            print(f"⚠️ Semantic similarity error: {e}")
        
        return candidates
    
    def correct_word(self, word: str, context: str = "") -> Optional[str]:
        """Correct a single word using multiple approaches."""
        word_lower = word.lower()
        
        # Check if word is already correct
        if word_lower in self.vocabulary:
            return word_lower
        
        # Check common typos first
        if word_lower in self.typo_to_correct:
            return self.typo_to_correct[word_lower]
        
        # Check expansions
        if word_lower in self.ecommerce_expansions:
            expanded = self.ecommerce_expansions[word_lower]
            if expanded in self.vocabulary:
                return expanded
        
        all_candidates = []
        
        # Get edit distance candidates
        edit_candidates = self._get_edit_distance_candidates(word)
        for candidate, score in edit_candidates[:10]:  # Top 10
            all_candidates.append((candidate, score, 'edit'))
        
        # Get phonetic candidates
        phonetic_candidates = self._get_phonetic_candidates(word)
        for candidate in phonetic_candidates:
            score = self.word_frequencies[candidate] * 0.8  # Lower weight than edit distance
            all_candidates.append((candidate, score, 'phonetic'))
        
        # Get semantic candidates
        semantic_candidates = self._get_semantic_candidates(word, context)
        for candidate in semantic_candidates:
            score = self.word_frequencies[candidate] * 0.9  # Higher weight for semantic
            all_candidates.append((candidate, score, 'semantic'))
        
        if not all_candidates:
            return None
        
        # Sort by score and return best candidate
        all_candidates.sort(key=lambda x: x[1], reverse=True)
        best_candidate = all_candidates[0]
        
        # Only return if confidence is reasonable
        if best_candidate[1] > 1.0:  # Minimum confidence threshold
            return best_candidate[0]
        
        return None
    
    def correct_query(self, query: str) -> Dict[str, any]:
        """Correct a full query and return detailed results."""
        original_query = query.strip()
        words = self._tokenize(original_query)
        
        if not words:
            return {
                "original": original_query,
                "corrected": original_query,
                "corrections_made": False,
                "word_corrections": []
            }
        
        corrected_words = []
        word_corrections = []
        corrections_made = False
        
        for i, word in enumerate(words):
            # Build context from surrounding words
            context_words = []
            if i > 0:
                context_words.append(words[i-1])
            if i < len(words) - 1:
                context_words.append(words[i+1])
            context = " ".join(context_words)
            
            corrected_word = self.correct_word(word, context)
            
            if corrected_word and corrected_word != word.lower():
                corrected_words.append(corrected_word)
                word_corrections.append({
                    "original": word,
                    "corrected": corrected_word,
                    "position": i
                })
                corrections_made = True
            else:
                corrected_words.append(word.lower())
        
        corrected_query = " ".join(corrected_words)
        
        return {
            "original": original_query,
            "corrected": corrected_query if corrections_made else original_query,
            "corrections_made": corrections_made,
            "word_corrections": word_corrections,
            "confidence": len(word_corrections) / len(words) if words else 0
        }


# Global instance for API use
_spell_corrector = None

def get_corrector() -> EcommerceSpellCorrector:
    """Get or create the spell corrector instance."""
    global _spell_corrector
    if _spell_corrector is None:
        _spell_corrector = EcommerceSpellCorrector()
    return _spell_corrector

def get_corrected_query(query: str) -> Optional[str]:
    """Legacy function for backward compatibility."""
    corrector = get_corrector()
    result = corrector.correct_query(query)
    
    if result["corrections_made"]:
        return result["corrected"]
    return None

def get_detailed_correction(query: str) -> Dict[str, any]:
    """Get detailed correction results."""
    corrector = get_corrector()
    return corrector.correct_query(query)