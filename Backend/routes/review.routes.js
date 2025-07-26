
import express from 'express'
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :productId
import reviewController from '../controllers/review.controller.js'; // Assuming controller exists
// import authMiddleware from '../middleware/auth.middleware.js'; // Optional: for protected routes

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Create a new review for a specific product.
 * @access  Private (Logged-in users)
 */
router.post('/', /* authMiddleware.protect, */ reviewController.createReview);

/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Get all reviews for a specific product.
 * @access  Public
 */
router.get('/', reviewController.getProductReviews);

export default router;