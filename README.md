# SearchOptimizer

A smart product search system that combines:
- Semantic search using Sentence Transformers
- Keyword boosting for exact title matches
- Image-to-text search using BLIP (image captioning)

---

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/tanny1357/SearchOptimizer.git
cd SearchOptimizer
```

### 2. Create and activate virtual environment

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# On macOS/Linux:
# source venv/bin/activate
```

### 3. Install backend dependencies

# Install requirements for ml-models:

```bash
cd ml-models
pip install -r requirements.txt
cd ..
```

# Install requirements for genai-recommendations:

```bash
cd genai-recommendations
pip install -r requirements.txt
cd ..
```  

## 🚀 Running the Project

### 🧠 Start the backend server

### Start ML models backend (ml-models):

```bash
cd ml-models
uvicorn main:app --reload
```

### Start GenAI Recommendations backend (genai-recommendations):

```bash
Open a new terminal window/tab.
cd genai-recommendations
uvicorn main:app --reload
```

The FastAPI backends will run at:
- ML Models: `http://127.0.0.1:8000`
- GenAI Recommendations: `http://127.0.0.1:8001`

---

### 💻 Start the frontend (React)

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 📸 Features

- 🔍 **Semantic search** using `all-MiniLM-L6-v2`
- 💡 **Hybrid ranking** with exact keyword boost in titles
- 🖼️ **Image upload** using BLIP model for caption generation
- ⚡ FastAPI + React + Tailwind + Sentence Transformers

---

## 🔗 API Endpoints

| Method | Endpoint              | Description                     |
|--------|------------------------|---------------------------------|
| POST   | `/semantic-search`     | Query using text search         |
| POST   | `/image-to-caption`    | Upload image, get caption, search |
| GET    | `/search?query=...`    | Suggestion list (for autocomplete) |

---

## 📁 Project Structure

```
SearchOptimizer/
├── frontend/              # React app
├── ml-models/
│   ├── main.py            # FastAPI backend
│   ├── caption_image.py   # BLIP image-to-text
│   └── products.json      # Product data with embeddings
└── requirements.txt       # Backend dependencies
```

---

## 🧠 Model Notes

- **Text embedding**: `all-MiniLM-L6-v2` (sentence-transformers)
- **Image captioning**: Salesforce's `BLIP` model via transformers
