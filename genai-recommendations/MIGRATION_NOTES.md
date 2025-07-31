# Migration Notes: OpenAI to Google Gemini

## Changes Made

1. **Environment Variables**: Updated `.env` file to use `GOOGLE_API_KEY` instead of `OPENAI_API_KEY`

2. **Configuration**: Updated `config.py` to use Google Gemini API configuration

3. **API Integration**: Updated all API calls to use Google Gemini's Generative AI models

4. **Model Names**: Updated model reference to use Gemini's format: `gemini-1.5-flash`

5. **Embeddings**: Updated to use Google's embedding model: `models/embedding-001`

6. **Chunk Size**: Increased text chunk size to 1500 as requested

## Files Modified

- `.env`: Updated API key variable name to `GOOGLE_API_KEY`
- `recommendation.py`: Updated to use Google Gemini configuration and models
- `config.py`: New configuration file for Google Gemini settings
- `requirements.txt`: Updated to include `langchain-google-genai` package
- `README.md`: Updated documentation to reflect Google Gemini usage
- `test_config.py`: Test script to verify Google Gemini configuration

## Dependencies

- Removed: `openai` package
- Added: `langchain-google-genai` package for Google Gemini integration

## Testing

Run the test script to verify configuration:
```bash
python test_config.py
```

## Notes

- Google Gemini provides powerful generative AI capabilities with competitive pricing
- The `gemini-1.5-flash` model offers fast responses with good quality
- Embeddings are handled by Google's `models/embedding-001` model
- Text chunk size increased to 1500 for better context processing

## Available Gemini Models

Some popular models available through Google Gemini:
- `gemini-1.5-flash`: Fast and efficient for most tasks
- `gemini-1.5-pro`: More capable for complex reasoning
- `gemini-1.0-pro`: Older version but still capable

Update the `DEFAULT_MODEL` in `config.py` to use different models.
