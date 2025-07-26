
import express from express
const router = express.Router();
const productController = require('../controllers/product.controller'); // Assuming controller exists
// const authMiddleware = require('../middleware/auth.middleware'); // Optional: for protected routes

/**
 * @route   POST /api/products
 * @desc    Create a new product.
 * @access  Private/Admin
 */
router.post('/', /* authMiddleware.isAdmin, */ productController.createProduct);

/**
 * @route   GET /api/products
 * @desc    Get a list of all products (with pagination).
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by its ID.
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product.
 * @access  Private/Admin
 */
router.put('/:id', /* authMiddleware.isAdmin, */ productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product.
 * @access  Private/Admin
 */
router.delete('/:id', /* authMiddleware.isAdmin, */ productController.deleteProduct);

module.exports = router;