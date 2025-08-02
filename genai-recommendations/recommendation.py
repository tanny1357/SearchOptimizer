import os
from dotenv import load_dotenv
import streamlit as st
from langchain.chains import RetrievalQA, LLMChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.document_loaders import DataFrameLoader
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from config import get_gemini_config

# Load environment variables from .env file
load_dotenv()

def process_data(refined_df):
    """
    Process the refined dataset and create the vector store.
    
    Args:
        refined_df (pd.DataFrame): Preprocessed dataset DataFrame.
        
    Returns:
        vectorstore (FAISS): Vector store containing the processed data.
    """
    refined_df['combined_info'] = refined_df.apply(lambda row: f"Product ID: {row['pid']}. Product URL: {row['product_url']}. Product Name: {row['product_name']}. Primary Category: {row['primary_category']}. Retail Price: ${row['retail_price']}. Discounted Price: ${row['discounted_price']}. Primary Image Link: {row['primary_image_link']}. Description: {row['description']}. Brand: {row['brand']}. Gender: {row['gender']}", axis=1)

    loader = DataFrameLoader(refined_df, page_content_column="combined_info")
    docs = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    texts = text_splitter.split_documents(docs)

    # Use HuggingFace embeddings to avoid async issues
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vectorstore = FAISS.from_documents(texts, embeddings)

    return vectorstore

def save_vectorstore(vectorstore, directory):
    """
    Save the vector store to a directory.
    
    Args:
        vectorstore (FAISS): Vector store to be saved.
        directory (str): Directory to save the vector store.
    """
    vectorstore.save_local(directory)

def load_vectorstore(directory, embeddings):
    """
    Load the vector store from a directory.
    
    Args:
        directory (str): Directory containing the saved vector store.
        embeddings (HuggingFaceEmbeddings): Embeddings object.
        
    Returns:
        vectorstore (FAISS): Loaded vector store.
    """
    vectorstore = FAISS.load_local(directory, embeddings, allow_dangerous_deserialization = True  )
    return vectorstore

def display_product_recommendation(refined_df):
    """
    Display product recommendation section.
    
    Args:
        refined_df (pd.DataFrame): Preprocessed dataset DataFrame.
    """
    st.header("Product Recommendation")

    vectorstore_dir = 'vectorstore'

    # Use HuggingFace embeddings to avoid async issues
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    if os.path.exists(vectorstore_dir):
        vectorstore = load_vectorstore(vectorstore_dir, embeddings)
    else:
        vectorstore = process_data(refined_df)
        save_vectorstore(vectorstore, vectorstore_dir)

    manual_template = """
    Based on the product department: {department}

    Provide exactly 3 product recommendations in this structured format:

    Product 1:
    - Department: [department name]
    - Category: [product category]
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Product 2:
    - Department: [department name]
    - Category: [product category]  
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Product 3:
    - Department: [department name]
    - Category: [product category]
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Do not include any explanatory text or paragraphs. Only provide the structured product data above.
    """
    prompt_manual = PromptTemplate(
        input_variables=["department"],
        template=manual_template,
    )

    config = get_gemini_config()
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        google_api_key=config["google_api_key"],
        model=config["model_name"],
        temperature=0
    )

    chain = LLMChain(
        llm=llm,
        prompt=prompt_manual,
        verbose=True)

    chatbot_template = """
    You are a retail shopping assistant. Based on the context and customer input, provide exactly 3 product recommendations.

    Use this structured format only:

    Product 1:
    - Category: [category]
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Product 2:
    - Category: [category]
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Product 3:
    - Category: [category]
    - Name: [product name]
    - Price: $[price]
    - Stock: [quantity] units

    Sort products by price (cheapest first).
    Do not include explanatory text, introductions, or paragraphs.
    If you don't know the answer, respond with: "No matching products found."

    {context}

    Chat history: {history}

    Input: {question}
    Your Response:
    """
    chatbot_prompt = PromptTemplate(
        input_variables=["context", "history", "question"],
        template=chatbot_template,
    )

    memory = ConversationBufferMemory(memory_key="history", input_key="question", return_messages=True)

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type='stuff',
        retriever=vectorstore.as_retriever(),
        verbose=True,
        chain_type_kwargs={
            "verbose": True,
            "prompt": chatbot_prompt,
            "memory": memory}
    )

    department = st.text_input("Product Department")
    category = st.text_input("Product Category")
    brand = st.text_input("Product Brand")
    price = st.text_input("Maximum Price Range")

    if st.button("Get Recommendations"):
        response = chain.run(
            department=department,
            category=category,
            brand=brand,
            price=price
        )
        st.write(response)