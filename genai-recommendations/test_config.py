#!/usr/bin/env python3
"""
Test script to verify Gemini API configuration
"""
import os
from dotenv import load_dotenv
from config import get_gemini_config

def test_gemini_config():
    """Test Gemini configuration"""
    print("Testing Gemini Configuration...")
    
    # Load environment variables
    load_dotenv()
    
    # Check if API key is loaded
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✓ Gemini API key loaded: {api_key[:20]}...")
    else:
        print("✗ Gemini API key not found in environment variables")
        return False
    
    # Test configuration
    config = get_gemini_config()
    print(f"✓ Configuration loaded:")
    print(f"  - Model: {config['model_name']}")
    print(f"  - API Key: {config['google_api_key'][:20]}...")
    
    return True

if __name__ == "__main__":
    success = test_gemini_config()
    if success:
        print("\n✓ All tests passed! Gemini configuration is ready.")
    else:
        print("\n✗ Configuration test failed. Please check your .env file.")
