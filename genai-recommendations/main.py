# main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import pandas as pd
from dotenv import load_dotenv
from langchain.chains import RetrievalQA, LLMChain
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.document_loaders import DataFrameLoader
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from ast import literal_eval
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="E-commerce Product Recommendation API",
    description="API for product recommendations using AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class RecommendationRequest(BaseModel):
    department: Optional[str] = None
    category: Optional[str] = None  
    brand: Optional[str] = None
    price: Optional[str] = None

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"

class RecommendationResponse(BaseModel):
    recommendations: str
    status: str

class ChatResponse(BaseModel):
    response: str
    status: str

# Global variables for caching
vectorstore = None
embeddings = None
qa_chain = None
manual_chain = None
memories = {}  # Store conversation memories by session_id

# Data processing functions (from your original code)
def extract_primary_category(product_category_tree):
    try:
        return literal_eval(product_category_tree)[0].split('>>')[0].strip()
    except (ValueError, SyntaxError, IndexError):
        return None

def extract_primary_image(image_str):
    try:
        images = literal_eval(image_str)
        if images and isinstance(images, list):
            return images[0]
    except (ValueError, SyntaxError):
        return None

def determine_gender(product_name, description):
    keywords_women = ['women', 'woman', 'female', 'girls', 'girl', 'ladies', 'lady']
    keywords_men = ['men', 'man', 'male', 'boys', 'boy', 'gentlemen', 'gentleman']

    name_desc = f"{str(product_name).lower()} {str(description).lower()}"
    if any(keyword in name_desc for keyword in keywords_women):
        return 'Women'
    elif any(keyword in name_desc for keyword in keywords_men):
        return 'Men'
    else:
        return 'Unisex'

def load_data(dataset_path):
    try:
        return pd.read_csv(dataset_path)
    except Exception as e:
        logger.error(f"Error loading dataset: {str(e)}")
        return None

def preprocess_data(df):
    df['primary_category'] = df['product_category_tree'].apply(extract_primary_category)
    df['primary_image_link'] = df['image'].apply(extract_primary_image)
    df['gender'] = df.apply(lambda x: determine_gender(x['product_name'], x['description']), axis=1)

    columns_of_interest = ['pid', 'product_url', 'product_name', 'primary_category',
                           'retail_price', 'discounted_price', 'primary_image_link',
                           'description', 'brand', 'gender']
    refined_df = df[columns_of_interest]
    refined_df = refined_df.dropna(subset=['primary_category', 'retail_price', 'discounted_price'])
    return refined_df

def process_data(refined_df):
    refined_df['combined_info'] = refined_df.apply(
        lambda row: f"Product ID: {row['pid']}. Product URL: {row['product_url']}. "
                   f"Product Name: {row['product_name']}. Primary Category: {row['primary_category']}. "
                   f"Retail Price: ${row['retail_price']}. Discounted Price: ${row['discounted_price']}. "
                   f"Primary Image Link: {row['primary_image_link']}. Description: {row['description']}. "
                   f"Brand: {row['brand']}. Gender: {row['gender']}", axis=1
    )

    loader = DataFrameLoader(refined_df, page_content_column="combined_info")
    docs = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    texts = text_splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(texts, embeddings)

    return vectorstore, embeddings

def get_openrouter_config():
    return {
        "openai_api_key": os.getenv("OPENROUTER_API_KEY"),
        "openai_api_base": "https://openrouter.ai/api/v1",
        "model_name": "openai/gpt-3.5-turbo"
    }

def initialize_chains():
    global vectorstore, embeddings, qa_chain, manual_chain
    
    try:
        # Load and preprocess data
        dataset_path = 'flipkart_com-ecommerce_sample.csv'
        df = load_data(dataset_path)
        
        if df is None:
            raise Exception("Failed to load dataset")
        
        refined_df = preprocess_data(df)
        
        # Check if vectorstore exists
        vectorstore_dir = 'vectorstore'
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        if os.path.exists(vectorstore_dir):
            vectorstore = FAISS.load_local(vectorstore_dir, embeddings, allow_dangerous_deserialization=True)
            logger.info("Loaded existing vectorstore")
        else:
            vectorstore, embeddings = process_data(refined_df)
            vectorstore.save_local(vectorstore_dir)
            logger.info("Created new vectorstore")
        
        # Initialize LLM
        config = get_openrouter_config()
        llm = ChatOpenAI(
            openai_api_key=config["openai_api_key"],
            openai_api_base=config["openai_api_base"],
            model_name=config["model_name"],
            temperature=0
        )
        
        # Manual recommendation template
        manual_template = """
        Kindly suggest three similar products based on the description I have provided below:

        Product Department: {department}.
        Product Category: {category}.
        Product Brand: {brand}.
        Maximum Price Range: {price}.

        Please provide complete answers including product department name, product category, product name, price, and stock quantity.
        """
        prompt_manual = PromptTemplate(
            input_variables=["department", "category", "brand", "price"],
            template=manual_template,
        )
        
        manual_chain = LLMChain(llm=llm, prompt=prompt_manual, verbose=True)
        
        # Chatbot template
        chatbot_template = """
        You are a friendly, conversational retail shopping assistant that helps customers find products that match their preferences.
        From the following context and chat history, assist customers in finding what they are looking for based on their input.
        For each question, suggest three products, including their category, price, and current stock quantity.
        Sort the answer by the cheapest product.
        If you don't know the answer, just say that you don't know, don't try to make up an answer.

        {context}

        Chat history: {history}

        Input: {question}
        Your Response:
        """
        chatbot_prompt = PromptTemplate(
            input_variables=["context", "history", "question"],
            template=chatbot_template,
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type='stuff',
            retriever=vectorstore.as_retriever(),
            verbose=True,
            chain_type_kwargs={
                "verbose": True,
                "prompt": chatbot_prompt,
            }
        )
        
        logger.info("Successfully initialized recommendation chains")
        
    except Exception as e:
        logger.error(f"Error initializing chains: {str(e)}")
        raise

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    try:
        initialize_chains()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "E-commerce Product Recommendation API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "vectorstore_loaded": vectorstore is not None,
        "chains_initialized": qa_chain is not None and manual_chain is not None
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    try:
        if manual_chain is None:
            raise HTTPException(status_code=500, detail="Recommendation system not initialized")
        
        # Run the manual recommendation chain
        response = manual_chain.run(
            department=request.department or "",
            category=request.category or "",
            brand=request.brand or "",
            price=request.price or ""
        )
        
        return RecommendationResponse(
            recommendations=response,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    try:
        if qa_chain is None:
            raise HTTPException(status_code=500, detail="Chat system not initialized")
        
        # Get or create memory for this session
        if request.session_id not in memories:
            memories[request.session_id] = ConversationBufferMemory(
                memory_key="history", 
                input_key="question", 
                return_messages=True
            )
        
        memory = memories[request.session_id]
        
        # Update the QA chain with the session-specific memory
        qa_chain.combine_documents_chain.llm_chain.memory = memory
        
        # Get response from QA chain
        response = qa_chain.run(question=request.question)
        
        return ChatResponse(
            response=response,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error in chat_with_assistant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

@app.delete("/chat/{session_id}")
async def clear_chat_history(session_id: str):
    try:
        if session_id in memories:
            del memories[session_id]
            return {"message": f"Chat history cleared for session {session_id}", "status": "success"}
        else:
            return {"message": f"No chat history found for session {session_id}", "status": "not_found"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error clearing chat history")

@app.post("/reinitialize")
async def reinitialize_system():
    try:
        await startup_event()
        return {"message": "System reinitialized successfully", "status": "success"}
    except Exception as e:
        logger.error(f"Error reinitializing system: {str(e)}")
        raise HTTPException(status_code=500, detail="Error reinitializing system")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)