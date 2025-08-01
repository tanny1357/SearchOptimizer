"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  FiFilter,
  FiX,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiShoppingCart,
  FiHeart,
  FiEye,
  FiZap,
  FiTrendingUp,
  FiSearch,
} from "react-icons/fi"

// Enhanced Button component with animations
const Button = ({
  children,
  className = "",
  variant = "default",
  disabled = false,
  onClick,
  type = "button",
  size = "md",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform hover:scale-105 active:scale-95"

  const variants = {
    default:
      "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl",
    secondary:
      "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white bg-white shadow-md hover:shadow-lg",
    ghost: "text-gray-600 hover:text-blue-600 hover:bg-blue-50",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Enhanced Input component
const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-blue-300 ${className}`}
      {...props}
    />
  )
}

export default function ResultsPage() {
  // Get query from URL parameters (vanilla JS approach)
  const getQueryParam = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("query") || ""
    }
    return ""
  }

  const [originalQuery, setOriginalQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [correctedQuery, setCorrectedQuery] = useState(null)
  const [usedQuery, setUsedQuery] = useState("")
  const [sortOption, setSortOption] = useState("relevance")
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    rating: true,
    brand: true,
    category: true,
  })

  const [newQuery, setNewQuery] = useState("")

  const handleNewSearch = (e) => {
    e.preventDefault()
    if (newQuery.trim()) {
      // Update URL and trigger new search
      window.history.pushState({}, "", `?query=${encodeURIComponent(newQuery.trim())}`)
      setOriginalQuery(newQuery.trim())
      setNewQuery("")
    }
  }

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])

  const brands = ["Samsung", "Apple", "Sony", "LG", "Xiaomi"]
  const categories = ["Electronics", "Smartphones", "Accessories", "Computers", "Home Appliances"]

  useEffect(() => {
    setIsVisible(true)
    setOriginalQuery(getQueryParam())
  }, [])

  useEffect(() => {
    if (!originalQuery) return

    let cancelled = false
    setLoading(true)

    async function checkCorrection() {
      try {
        const res = await axios.get("http://127.0.0.1:8000/spellcheck", {
          params: { query: originalQuery },
        })

        if (!cancelled && res.data.corrected && res.data.corrected !== originalQuery) {
          setCorrectedQuery(res.data.corrected)
          setUsedQuery(res.data.corrected)
        } else if (!cancelled) {
          setCorrectedQuery(null)
          setUsedQuery(originalQuery)
        }
      } catch {
        setCorrectedQuery(null)
        setUsedQuery(originalQuery)
      }
    }

    checkCorrection()
    return () => {
      cancelled = true
    }
  }, [originalQuery])

  useEffect(() => {
    if (usedQuery) {
      setLoading(true)
      axios
        .get("http://127.0.0.1:8000/search", {
          params: {
            query: usedQuery,
            semantic: true,
            sort: sortOption,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            rating: selectedRating,
            brands: selectedBrands.join(","),
            categories: selectedCategories.join(","),
          },
        })
        .then((res) => {
          setResults(res.data.results || [])
          setLoading(false)
        })
        .catch(() => {
          setResults([])
          setLoading(false)
        })
    }
  }, [usedQuery, sortOption, priceRange, selectedRating, selectedBrands, selectedCategories])

  const toggleFilterSection = (section) => {
    setExpandedFilters({
      ...expandedFilters,
      [section]: !expandedFilters[section],
    })
  }

  const toggleBrand = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand))
    } else {
      setSelectedBrands([...selectedBrands, brand])
    }
  }

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handlePriceChange = (index, value) => {
    const newPriceRange = [...priceRange]
    newPriceRange[index] = Number.parseInt(value)
    setPriceRange(newPriceRange)
  }

  const handleRatingChange = (rating) => {
    setSelectedRating(rating === selectedRating ? 0 : rating)
  }

  const clearAllFilters = () => {
    setPriceRange([0, 5000])
    setSelectedRating(0)
    setSelectedBrands([])
    setSelectedCategories([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-yellow-300/10 to-blue-300/10 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-300/10 to-yellow-300/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full opacity-40 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Query correction banner */}
      {correctedQuery && correctedQuery !== originalQuery && (
        <div
          className={`mx-4 mt-4 lg:mx-auto lg:max-w-7xl transition-all duration-700 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-yellow-50 border-l-4 border-blue-500 p-4 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiZap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  ✨ Showing results for <span className="font-bold">{correctedQuery}</span> instead of{" "}
                  <span className="font-medium">{originalQuery}</span>
                </p>
                <button
                  className="text-sm font-medium text-blue-700 hover:text-blue-900 underline mt-1 transition-colors"
                  onClick={() => setUsedQuery(originalQuery)}
                >
                  Search for exact term instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar on Results Page */}
      <div
        className={`mb-6 transition-all duration-700 delay-100 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <form onSubmit={handleNewSearch} className="relative group max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-full shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300">
            <FiSearch className="ml-4 text-blue-500 text-lg" />
            <Input
              type="text"
              placeholder="Search for something else..."
              className="flex-1 py-4 px-4 text-base border-none focus:ring-0 bg-transparent"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-r-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {/* Mobile filter button */}
        <div
          className={`lg:hidden flex justify-between items-center mb-6 transition-all duration-700 delay-200 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
            Search Results <span className="text-gray-500 font-normal text-lg">({results.length} items)</span>
          </h1>
          <Button
            onClick={() => setFiltersOpen(!filtersOpen)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <FiFilter />
            <span>Filters</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar */}
          <div
            className={`${filtersOpen ? "block" : "hidden"} lg:block lg:w-80 transition-all duration-700 delay-300 transform ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-white/20 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
                  ✨ Filters
                </h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Enhanced Price Range Filter */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <div
                  className="flex justify-between items-center cursor-pointer mb-4 p-2 rounded-xl hover:bg-blue-50 transition-all"
                  onClick={() => toggleFilterSection("price")}
                >
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">💰</span> Price Range
                  </h4>
                  {expandedFilters.price ? (
                    <FiChevronUp className="text-blue-500" />
                  ) : (
                    <FiChevronDown className="text-blue-500" />
                  )}
                </div>

                {expandedFilters.price && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(0, e.target.value)}
                        placeholder="Min"
                        className="text-center"
                      />
                      <span className="text-gray-400 font-medium">to</span>
                      <Input
                        type="number"
                        min={priceRange[0]}
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                        placeholder="Max"
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(0, e.target.value)}
                        className="w-full h-2 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                        className="w-full h-2 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <div className="text-center text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-yellow-50 p-3 rounded-xl">
                      ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Rating Filter */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <div
                  className="flex justify-between items-center cursor-pointer mb-4 p-2 rounded-xl hover:bg-yellow-50 transition-all"
                  onClick={() => toggleFilterSection("rating")}
                >
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">⭐</span> Rating
                  </h4>
                  {expandedFilters.rating ? (
                    <FiChevronUp className="text-yellow-500" />
                  ) : (
                    <FiChevronDown className="text-yellow-500" />
                  )}
                </div>

                {expandedFilters.rating && (
                  <div className="space-y-3 mt-4">
                    {[4, 3, 2, 1].map((rating) => (
                      <div
                        key={rating}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                          selectedRating === rating
                            ? "bg-gradient-to-r from-yellow-100 to-blue-100 border-2 border-yellow-300 shadow-md transform scale-105"
                            : "hover:bg-gray-50 hover:shadow-sm"
                        }`}
                        onClick={() => handleRatingChange(rating)}
                      >
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < rating ? "fill-current" : ""} transition-all duration-200`}
                            />
                          ))}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">& Up</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Brand Filter */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <div
                  className="flex justify-between items-center cursor-pointer mb-4 p-2 rounded-xl hover:bg-blue-50 transition-all"
                  onClick={() => toggleFilterSection("brand")}
                >
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🏷️</span> Brand
                  </h4>
                  {expandedFilters.brand ? (
                    <FiChevronUp className="text-blue-500" />
                  ) : (
                    <FiChevronDown className="text-blue-500" />
                  )}
                </div>

                {expandedFilters.brand && (
                  <div className="space-y-3 mt-4">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center p-2 rounded-xl hover:bg-gray-50 transition-all">
                        <input
                          id={`brand-${brand}`}
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md transition-all"
                        />
                        <label
                          htmlFor={`brand-${brand}`}
                          className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhanced Category Filter */}
              <div className="mb-6">
                <div
                  className="flex justify-between items-center cursor-pointer mb-4 p-2 rounded-xl hover:bg-yellow-50 transition-all"
                  onClick={() => toggleFilterSection("category")}
                >
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📂</span> Category
                  </h4>
                  {expandedFilters.category ? (
                    <FiChevronUp className="text-yellow-500" />
                  ) : (
                    <FiChevronDown className="text-yellow-500" />
                  )}
                </div>

                {expandedFilters.category && (
                  <div className="space-y-3 mt-4">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center p-2 rounded-xl hover:bg-gray-50 transition-all">
                        <input
                          id={`category-${category}`}
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded-md transition-all"
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={clearAllFilters} variant="outline" className="w-full bg-transparent">
                🗑️ Clear All Filters
              </Button>
            </div>
          </div>

          {/* Enhanced Results area */}
          <div className="flex-1">
            {/* Enhanced Results header */}
            <div
              className={`hidden lg:flex justify-between items-center mb-8 bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-white/20 transition-all duration-700 delay-400 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
                  Results for "{usedQuery}"
                </span>
                <span className="text-gray-500 font-normal text-xl ml-2">({results.length} items)</span>
              </h1>
              <div className="flex items-center space-x-3">
                <label htmlFor="sort" className="text-sm font-medium text-gray-600">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white transition-all"
                >
                  <option value="relevance">✨ Relevance</option>
                  <option value="price_asc">💰 Price: Low to High</option>
                  <option value="price_desc">💎 Price: High to Low</option>
                  <option value="rating">⭐ Rating</option>
                  <option value="newest">🆕 Newest First</option>
                </select>
              </div>
            </div>

            {/* Mobile sort dropdown */}
            <div
              className={`lg:hidden mb-6 transition-all duration-700 delay-500 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
              >
                <option value="relevance">Sort by: ✨ Relevance</option>
                <option value="price_asc">Sort by: 💰 Price: Low to High</option>
                <option value="price_desc">Sort by: 💎 Price: High to Low</option>
                <option value="rating">Sort by: ⭐ Rating</option>
                <option value="newest">Sort by: 🆕 Newest First</option>
              </select>
            </div>

            {/* Enhanced Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/20 animate-pulse"
                  >
                    <div className="h-64 bg-gradient-to-br from-blue-100 to-yellow-100"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-full w-3/4 mb-3"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-full w-1/2 mb-4"></div>
                      <div className="h-6 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-full w-1/4 mb-4"></div>
                      <div className="h-12 bg-gradient-to-r from-blue-200 to-yellow-200 rounded-full w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {results.map((product, index) => (
                  <div
                    key={product.id || index}
                    className={`group bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer animate-fadeIn`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onMouseEnter={() => setHoveredProduct(index)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={product.image || `/placeholder.svg?height=400&width=400&text=Product ${index + 1}`}
                        alt={product.title || `Product ${index + 1}`}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Enhanced badges */}
                      {product.discount && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center shadow-lg animate-pulse">
                          <FiZap className="mr-1" />
                          {product.discount}% OFF
                        </div>
                      )}

                      {product.isNew && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                          ✨ NEW
                        </div>
                      )}

                      {/* Hover overlay with quick actions */}
                      <div
                        className={`absolute inset-0 bg-black/20 flex items-center justify-center space-x-3 transition-all duration-300 ${hoveredProduct === index ? "opacity-100" : "opacity-0"}`}
                      >
                        <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110">
                          <FiEye className="text-blue-600" />
                        </button>
                        <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110">
                          <FiHeart className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 text-base mb-3 line-clamp-2 h-12 group-hover:text-blue-600 transition-colors">
                        {product.title || `Amazing Product ${index + 1}`}
                      </h3>

                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < (product.rating || 4) ? "fill-current" : ""} w-4 h-4 transition-all duration-200`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2 font-medium">
                          ({product.reviewCount || Math.floor(Math.random() * 1000) + 50})
                        </span>
                      </div>

                      <div className="flex items-center mb-6">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
                          ₹{product.price || Math.floor(Math.random() * 10000) + 500}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-3">₹{product.originalPrice}</span>
                        )}
                      </div>

                      <Button className="w-full group">
                        <FiShoppingCart className="mr-2 group-hover:animate-bounce" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center transition-all duration-700 delay-600 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent mb-4">
                  No products found
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  We couldn't find any products matching your search criteria. Try adjusting your filters!
                </p>
                <Button onClick={clearAllFilters} size="lg">
                  🗑️ Clear All Filters
                </Button>
              </div>
            )}

            {/* Enhanced pagination */}
            {!loading && results.length > 0 && (
              <div
                className={`flex justify-center mt-12 transition-all duration-700 delay-700 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <nav className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700">
                    1
                  </Button>
                  <Button variant="ghost" size="sm">
                    2
                  </Button>
                  <Button variant="ghost" size="sm">
                    3
                  </Button>
                  <span className="px-4 py-2 text-gray-500">...</span>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
