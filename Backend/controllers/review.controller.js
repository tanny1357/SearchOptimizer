import Review from '../Models/review.model.js';
import Product from '../Models/product.model.js';

const reviewController = {
  createReview: async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const review = new Review({
        productId,
        userId: req.user?.userId,
        rating,
        comment
      });

      await review.save();

      const reviews = await Review.find({ productId });
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await Product.findByIdAndUpdate(productId, { 
        rating: avgRating,
        reviewCount: reviews.length 
      });

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getProductReviews: async (req, res) => {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (page - 1) * limit;
      const reviews = await Review.find({ productId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Review.countDocuments({ productId });

      res.json({
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

export default reviewController;