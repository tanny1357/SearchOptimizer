import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiFilter, FiX, FiStar, FiChevronDown, FiChevronUp, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { MdOutlineLocalOffer } from 'react-icons/md';

function ResultsPage() {
  const [searchParams] = useSearchParams();
  const originalQuery = searchParams.get('query') || '';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [usedQuery, setUsedQuery] = useState('');
  const [sortOption, setSortOption] = useState('relevance');
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    rating: true,
    brand: true,
    category: true
  });

  // Example filter states
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Example filter options (in a real app, these might come from an API)
  const brands = ['Samsung', 'Apple', 'Sony', 'LG', 'Xiaomi'];
  const categories = ['Electronics', 'Smartphones', 'Accessories', 'Computers', 'Home Appliances'];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    async function checkCorrection() {
      try {
        const res = await axios.get('http://127.0.0.1:8000/spellcheck', {
          params: { query: originalQuery }
        });
        
        if (!cancelled && res.data.corrected && res.data.corrected !== originalQuery) {
          setCorrectedQuery(res.data.corrected);
          setUsedQuery(res.data.corrected);
        } else if (!cancelled) {
          setCorrectedQuery(null);
          setUsedQuery(originalQuery);
        }
      } catch {
        setCorrectedQuery(null);
        setUsedQuery(originalQuery);
      }
    }
    
    checkCorrection();
    return () => { cancelled = true; }
  }, [originalQuery]);

  useEffect(() => {
    if (usedQuery) {
      setLoading(true);
      axios.get('http://127.0.0.1:8000/search', {
        params: { 
          query: usedQuery, 
          semantic: true,
          sort: sortOption,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          rating: selectedRating,
          brands: selectedBrands.join(','),
          categories: selectedCategories.join(',')
        }
      }).then((res) => {
        setResults(res.data.results || []);
        setLoading(false);
      }).catch(() => {
        setResults([]);
        setLoading(false);
      });
    }
  }, [usedQuery, sortOption, priceRange, selectedRating, selectedBrands, selectedCategories]);

  // Toggle filter section visibility
  const toggleFilterSection = (section) => {
    setExpandedFilters({
      ...expandedFilters,
      [section]: !expandedFilters[section]
    });
  };

  // Toggle brand selection
  const toggleBrand = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  // Toggle category selection
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handlePriceChange = (index, value) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = parseInt(value);
    setPriceRange(newPriceRange);
  };

  // Handle rating selection
  const handleRatingChange = (rating) => {
    setSelectedRating(rating === selectedRating ? 0 : rating);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Query correction banner */}
      {correctedQuery && correctedQuery !== originalQuery && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 mx-4 mt-4 lg:mx-auto lg:max-w-7xl rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Showing results for <span className="font-medium">{correctedQuery}</span> instead of <span className="font-medium">{originalQuery}</span>
              </p>
              <button 
                className="text-sm font-medium text-blue-700 hover:text-blue-900 underline mt-1"
                onClick={() => setUsedQuery(originalQuery)}
              >
                Search for exact term instead
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Mobile filter button */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">
            Search Results <span className="text-gray-500 font-normal">({results.length} items)</span>
          </h1>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="bg-white p-2 rounded-md shadow text-gray-600 flex items-center space-x-1 border border-gray-300"
          >
            <FiFilter />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block lg:w-64 mr-6 mb-4 lg:mb-0 relative`}>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-gray-800">Filters</h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6 border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilterSection('price')}
                >
                  <h4 className="font-semibold text-gray-700">Price Range</h4>
                  {expandedFilters.price ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                
                {expandedFilters.price && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(0, e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Min"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min={priceRange[0]}
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Max"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      className="w-full mb-2"
                    />
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(1, e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Rating Filter */}
              <div className="mb-6 border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilterSection('rating')}
                >
                  <h4 className="font-semibold text-gray-700">Rating</h4>
                  {expandedFilters.rating ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                
                {expandedFilters.rating && (
                  <div className="space-y-2 mt-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div 
                        key={rating}
                        className={`flex items-center p-2 rounded cursor-pointer ${selectedRating === rating ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                        onClick={() => handleRatingChange(rating)}
                      >
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < rating ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">& Up</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Filter */}
              <div className="mb-6 border-b pb-4">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilterSection('brand')}
                >
                  <h4 className="font-semibold text-gray-700">Brand</h4>
                  {expandedFilters.brand ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                
                {expandedFilters.brand && (
                  <div className="space-y-2 mt-2">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center">
                        <input
                          id={`brand-${brand}`}
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`brand-${brand}`} className="ml-2 text-sm text-gray-700">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-2">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilterSection('category')}
                >
                  <h4 className="font-semibold text-gray-700">Category</h4>
                  {expandedFilters.category ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                
                {expandedFilters.category && (
                  <div className="space-y-2 mt-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center">
                        <input
                          id={`category-${category}`}
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setPriceRange([0, 5000]);
                  setSelectedRating(0);
                  setSelectedBrands([]);
                  setSelectedCategories([]);
                }}
                className="mt-4 w-full py-2 bg-gray-100 text-gray-800 rounded border border-gray-300 hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1">
            {/* Results header with sort and count */}
            <div className="hidden lg:flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">
                Results for <span className="text-blue-600">"{usedQuery}"</span> <span className="text-gray-500 font-normal">({results.length} items)</span>
              </h1>
              <div className="flex items-center">
                <label htmlFor="sort" className="mr-2 text-sm text-gray-600">Sort by:</label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Mobile sort dropdown */}
            <div className="lg:hidden mb-4">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price_asc">Sort by: Price: Low to High</option>
                <option value="price_desc">Sort by: Price: High to Low</option>
                <option value="rating">Sort by: Rating</option>
                <option value="newest">Sort by: Newest First</option>
              </select>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((product, index) => (
                  <div 
                    key={product.id || index} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img 
                        src={product.image || `https://source.unsplash.com/300x300/?product&id=${index}`} 
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                          <MdOutlineLocalOffer className="mr-1" />
                          {product.discount}% OFF
                        </div>
                      )}
                      {product.isNew && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 h-10">
                        {product.title}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < (product.rating || 4) ? 'fill-current' : ''} w-3 h-3`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          ({product.reviewCount || Math.floor(Math.random() * 1000) + 50})
                        </span>
                      </div>
                      <div className="flex items-center mb-4">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{product.price || Math.floor(Math.random() * 10000) + 500}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" 
                  alt="No results" 
                  className="w-24 h-24 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">We couldn't find any products matching your search criteria.</p>
                <button 
                  onClick={() => {
                    setPriceRange([0, 5000]);
                    setSelectedRating(0);
                    setSelectedBrands([]);
                    setSelectedCategories([]);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Simple pagination */}
            {!loading && results.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    1
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    3
                  </button>
                  <span className="px-4 py-2 text-gray-500">...</span>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;