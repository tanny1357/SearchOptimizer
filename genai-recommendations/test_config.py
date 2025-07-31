#!/usr/bin/env python3
"""
Test script to verify OpenRouter API configuration
"""
import os
from dotenv import load_dotenv
from config import get_openrouter_config

def test_openrouter_config():
    """Test OpenRouter configuration"""
    print("Testing OpenRouter Configuration...")
    
    # Load environment variables
    load_dotenv()
    
    # Check if API key is loaded
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        print(f"✓ OpenRouter API key loaded: {api_key[:20]}...")
    else:
        print("✗ OpenRouter API key not found in environment variables")
        return False
    
    # Test configuration
    config = get_openrouter_config()
    print(f"✓ Configuration loaded:")
    print(f"  - API Base URL: {config['openai_api_base']}")
    print(f"  - Model: {config['model_name']}")
    print(f"  - API Key: {config['openai_api_key'][:20]}...")
    
    return True

if __name__ == "__main__":
    success = test_openrouter_config()
    if success:
        print("\n✓ All tests passed! OpenRouter configuration is ready.")
    else:
        print("\n✗ Configuration test failed. Please check your .env file.")
