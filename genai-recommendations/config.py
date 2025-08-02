import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Default model for Gemini
DEFAULT_MODEL = "gemini-1.5-flash"

def get_gemini_config():
    """
    Get Gemini configuration for LangChain.
    
    Returns:
        dict: Configuration dictionary for Gemini API
    """
    return {
        "google_api_key": GEMINI_API_KEY,
        "model_name": DEFAULT_MODEL
    }
