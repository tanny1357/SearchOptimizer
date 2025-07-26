
import express from 'express'
const router = express.Router();
import searchController from '../controllers/search.controller.js'; // Assuming controller exists

/**
 * @route   GET /api/search/autosuggest
 * @desc    Get search suggestions based on a query prefix.
 * This powers the dropdown in the search bar.
 * @access  Public
 * @query   q - The prefix text typed by the user (e.g., "mobi").
 */
router.get('/autosuggest', searchController.getAutosuggest);

/**
 * @route   GET /api/search
 * @desc    Get the main search results page (SRP) for a given query.
 * @access  Public
 * @query   q - The full search query (e.g., "motorola g45 5g").
 * @query   sort - Sorting option (e.g., 'price_asc', 'rating_desc').
 * @query   filter - Filtering options (e.g., 'brand=Samsung&color=Blue').
 * @query   page - For pagination.
 * @query   limit - For pagination.
 */
router.get('/', searchController.getSearchResults);


export default router;