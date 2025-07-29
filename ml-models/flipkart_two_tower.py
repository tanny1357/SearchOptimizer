import torch
import torch.nn as nn
import torch.nn.functional as F
import sys
import os

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from two_tower_base_retrieval import TwoTowerBaseRetrieval
from baseline_mips_module import BaselineMIPSModule


class FlipkartTwoTower(nn.Module):
    """Adapted two-tower model for Flipkart dataset with multi-task learning"""
    
    def __init__(
        self,
        user_id_hash_size: int,
        item_id_hash_size: int,
        embedding_dim: int,
        user_feature_dim: int,
        item_feature_dim: int,
        user_history_seqlen: int,
        num_items_to_return: int = 20
    ):
        super().__init__()
        
        self.user_id_hash_size = user_id_hash_size
        self.item_id_hash_size = item_id_hash_size
        self.embedding_dim = embedding_dim
        self.user_feature_dim = user_feature_dim
        self.item_feature_dim = item_feature_dim
        self.user_history_seqlen = user_history_seqlen
        self.num_items_to_return = num_items_to_return
        
        # User tower components
        self.user_id_embedding = nn.Embedding(user_id_hash_size, embedding_dim)
        self.user_feature_net = nn.Sequential(
            nn.Linear(user_feature_dim, 256),
            nn.ReLU(),
            nn.Linear(256, embedding_dim)
        )
        self.user_history_net = nn.Sequential(
            nn.Embedding(item_id_hash_size, embedding_dim // 2),
            nn.LSTM(embedding_dim // 2, embedding_dim // 2, batch_first=True),
        )
        self.user_tower = nn.Sequential(
            nn.Linear(embedding_dim + embedding_dim + embedding_dim // 2, embedding_dim),  # id + features + history
            nn.ReLU(),
            nn.Linear(embedding_dim, embedding_dim)
        )
        
        # Item tower components  
        self.item_id_embedding = nn.Embedding(item_id_hash_size, embedding_dim)
        self.item_feature_net = nn.Sequential(
            nn.Linear(item_feature_dim, 256),
            nn.ReLU(),
            nn.Linear(256, embedding_dim)
        )
        self.item_tower = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),  # id + features
            nn.ReLU(),
            nn.Linear(embedding_dim, embedding_dim)
        )
        
        # Multi-task heads
        self.click_head = nn.Linear(1, 1)
        self.purchase_head = nn.Linear(1, 1)
        
        # MIPS module for inference
        self.mips_module = BaselineMIPSModule(
            corpus_size=item_id_hash_size,
            embedding_dim=embedding_dim
        )
        
    def get_user_embedding(
        self, 
        user_ids: torch.Tensor,
        user_features: torch.Tensor,
        user_history: torch.Tensor
    ) -> torch.Tensor:
        """Compute user embeddings"""
        # User ID embedding
        user_id_emb = self.user_id_embedding(user_ids)
        
        # User features embedding
        user_feat_emb = self.user_feature_net(user_features)
        
        # User history embedding (use LSTM)
        history_emb = self.user_history_net[0](user_history)  # Embedding layer
        lstm_out, (hidden, _) = self.user_history_net[1](history_emb)
        user_hist_emb = hidden[-1]  # Take last hidden state
        
        # Concatenate and pass through user tower
        user_input = torch.cat([user_id_emb, user_feat_emb, user_hist_emb], dim=1)
        user_embedding = self.user_tower(user_input)
        
        return user_embedding
    
    def get_item_embedding(
        self,
        item_ids: torch.Tensor,
        item_features: torch.Tensor
    ) -> torch.Tensor:
        """Compute item embeddings"""
        # Item ID embedding
        item_id_emb = self.item_id_embedding(item_ids)
        
        # Item features embedding
        item_feat_emb = self.item_feature_net(item_features)
        
        # Concatenate and pass through item tower
        item_input = torch.cat([item_id_emb, item_feat_emb], dim=1)
        item_embedding = self.item_tower(item_input)
        
        return item_embedding
    
    def forward(
        self,
        user_ids: torch.Tensor,
        user_features: torch.Tensor,
        user_history: torch.Tensor,
        item_ids: torch.Tensor,
        item_features: torch.Tensor,
        positions: torch.Tensor = None
    ):
        """Forward pass for training"""
        # Get embeddings
        user_emb = self.get_user_embedding(user_ids, user_features, user_history)
        item_emb = self.get_item_embedding(item_ids, item_features)
        
        # Compute interaction scores
        interaction_scores = torch.sum(user_emb * item_emb, dim=1, keepdim=True)
        
        # Multi-task predictions
        click_logits = self.click_head(interaction_scores)
        purchase_logits = self.purchase_head(interaction_scores)
        
        return {
            'click_logits': click_logits.squeeze(-1),
            'purchase_logits': purchase_logits.squeeze(-1),
            'user_embeddings': user_emb,
            'item_embeddings': item_emb
        }
    
    def retrieve_items(
        self,
        user_ids: torch.Tensor,
        user_features: torch.Tensor,
        user_history: torch.Tensor
    ):
        """Retrieve top items for given users"""
        user_emb = self.get_user_embedding(user_ids, user_features, user_history)
        
        # Use MIPS module to find top items
        top_items, scores, embeddings = self.mips_module(
            query_embedding=user_emb,
            num_items=self.num_items_to_return
        )
        
        return top_items, scores