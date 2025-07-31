import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Default model for OpenRouter
DEFAULT_MODEL = "openai/gpt-3.5-turbo"

def get_openrouter_config():
    """
    Get OpenRouter configuration for LangChain.
    
    Returns:
        dict: Configuration dictionary for OpenRouter API
    """
    return {
        "openai_api_key": OPENROUTER_API_KEY,
        "openai_api_base": OPENROUTER_BASE_URL,
        "model_name": DEFAULT_MODEL
    }
