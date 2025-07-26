// In routes/index.js

import express from express
const router = express.Router();

const searchRoutes = require('./search.routes');
const productRoutes = require('./product.routes');
const reviewRoutes = require('./review.routes');
const authRoutes = require('./auth.routes'); // <-- Add this line

// Mount the routes
router.use('/auth', authRoutes); // <-- Add this line
router.use('/search', searchRoutes);
router.use('/products', productRoutes);
router.use('/products/:productId/reviews', reviewRoutes);

module.exports = router;