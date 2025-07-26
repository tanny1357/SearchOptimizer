import express from 'express';
import searchRoutes from './search.routes.js';
import productRoutes from './product.routes.js';
import reviewRoutes from './review.routes.js';
import authRoutes from './auth.routes.js';

const router = express.Router();

// Mount the routes
// router.use('/auth', authRoutes);
// router.use('/search', searchRoutes);
// router.use('/products', productRoutes);
// router.use('/products/:productId/reviews', reviewRoutes);

export default router;