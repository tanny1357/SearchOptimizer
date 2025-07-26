import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const fetchSemanticResults = async (query) => {
  try {
    const response = await axios.post(`${API_BASE}/semantic-search`, { query });
    console.log("I am here");
    return response.data; // array of { title, description, score }
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
};