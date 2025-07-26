import Product from '../Models/product.model.js';
import SearchHistory from '../Models/searchHistory.model.js';

const searchController = {
  getAutosuggest: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const suggestions = await Product.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      })
      .limit(10)
      .select('name brand category')
      .lean();

      const formattedSuggestions = suggestions.map(product => ({
        text: product.name,
        brand: product.brand,
        category: product.category
      }));

      res.json(formattedSuggestions);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getSearchResults: async (req, res) => {
    try {
      const { q, sort = 'relevance', filter = '', page = 1, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const searchQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      };

      if (filter) {
        const filters = new URLSearchParams(filter);
        if (filters.get('brand')) {
          searchQuery.brand = filters.get('brand');
        }
        if (filters.get('category')) {
          searchQuery.category = filters.get('category');
        }
        if (filters.get('minPrice')) {
          searchQuery.price = { ...searchQuery.price, $gte: parseFloat(filters.get('minPrice')) };
        }
        if (filters.get('maxPrice')) {
          searchQuery.price = { ...searchQuery.price, $lte: parseFloat(filters.get('maxPrice')) };
        }
      }

      let sortOptions = {};
      switch (sort) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'rating_desc':
          sortOptions = { rating: -1 };
          break;
        case 'name_asc':
          sortOptions = { name: 1 };
          break;
        default:
          sortOptions = { _id: 1 };
      }

      const skip = (page - 1) * limit;
      const products = await Product.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Product.countDocuments(searchQuery);

      await SearchHistory.create({
        query: q,
        timestamp: new Date(),
        resultsCount: total
      });

      res.json({
        products,
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

export default searchController;