import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

/**
 * Fetch seasonal product recommendations based on user query and current time
 * @param {string} query - User search query
 * @param {string} month - Optional month name (uses current month if not provided)
 * @param {number} topK - Number of recommendations to return (default: 10)
 * @returns {Promise<Object>} Seasonal recommendations response
 */
export const fetchSeasonalRecommendations = async (query, month = null, topK = 10) => {
  try {
    const params = { query, top_k: topK };
    if (month) {
      params.month = month;
    }
    
    const response = await axios.get(`${API_BASE}/seasonal-recommendations`, { params });
    return response.data;
  } catch (error) {
    console.error('Seasonal recommendations failed:', error);
    return {
      success: false,
      query,
      month: month || new Date().toLocaleString('default', { month: 'long' }),
      season: 'Unknown',
      recommendations: [],
      relevant_count: 0,
      fallback_count: 0,
      has_fallback: false,
      error: error.message
    };
  }
};

/**
 * Get current month name
 * @returns {string} Current month name
 */
export const getCurrentMonth = () => {
  return new Date().toLocaleString('default', { month: 'long' });
};

/**
 * Get current season based on month
 * @param {string} month - Month name
 * @returns {string} Season name
 */
export const getSeasonFromMonth = (month) => {
  const monthMap = {
    'December': 'Winter', 'January': 'Winter', 'February': 'Winter',
    'March': 'Spring', 'April': 'Spring', 'May': 'Spring',
    'June': 'Summer', 'July': 'Summer', 'August': 'Summer',
    'September': 'Monsoon', 'October': 'Post-monsoon', 'November': 'Post-monsoon'
  };
  return monthMap[month] || 'Unknown';
};
