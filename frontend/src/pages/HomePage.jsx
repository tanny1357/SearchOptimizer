import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import { FaCamera } from 'react-icons/fa';

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/image-to-caption', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.caption) {
        setQuery(data.caption);
        navigate(`/search?query=${encodeURIComponent(data.caption)}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 pt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className={`text-left transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Smart Shopping with</span>
                  <span className="block text-blue-600">Flipkart</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Discover millions of products with our AI-powered semantic search engine that understands exactly what you're looking for.
                </p>

                {/* Enhanced Search Bar with Image Upload */}
                <div className={`mt-8 relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <form onSubmit={handleSearch} className="flex items-center overflow-hidden rounded-full border-2 border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 bg-white shadow-md">
                    <FiSearch className="ml-4 text-blue-500 text-xl" />
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      className="w-full py-3 px-4 focus:outline-none text-gray-600"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center">
                      <label className="cursor-pointer px-3 hover:text-blue-600 transition-colors" title="Search with an image">
                        <FaCamera className="text-xl" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-3 rounded-r-full font-medium"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                </div>

                {/* CTA Buttons */}
                <div className={`mt-8 flex gap-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <a
                    href="/explore"
                    className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all text-white px-8 py-3 rounded-md font-medium shadow-md"
                  >
                    Start Shopping
                  </a>
                  <a
                    href="/learn-more"
                    className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-8 py-3 rounded-md font-medium transform hover:scale-105 transition-all shadow-sm"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Background Image/Decoration */}
        <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block">
          <div className={`absolute inset-0 bg-blue-100 opacity-60 transition-opacity duration-1000 ${isVisible ? 'opacity-60' : 'opacity-0'}`}></div>
          <div className={`absolute right-0 transform translate-x-1/3 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <svg viewBox="0 0 200 200" className="w-full text-blue-500 opacity-20">
              <path fill="currentColor" d="M44.3,-76.4C58.4,-70.2,71.5,-59.5,79.9,-45.6C88.3,-31.7,92,-14.6,89.9,1.2C87.8,17,79.9,31.7,71.4,46.8C62.9,61.9,53.8,77.3,40.6,84.5C27.4,91.7,9.9,90.6,-5.4,85.3C-20.7,80,-33.9,70.5,-45.5,60.1C-57.1,49.8,-67.2,38.5,-73.4,24.9C-79.5,11.3,-81.7,-4.7,-78.8,-19.6C-75.8,-34.5,-67.7,-48.4,-56,-57.7C-44.3,-67,-29,-71.8,-14,-73.9C1,-76,15.9,-75.4,29.9,-78C43.9,-80.6,57.1,-86.4,44.3,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Shop with Flipkart?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Experience shopping like never before
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className={`rounded-lg p-6 bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
                  <FiSearch className="text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Smart Search</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our AI understands your intent, not just your keywords.
                </p>
              </div>

              {/* Feature 2 */}
              <div className={`rounded-lg p-6 bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
                  <FiShoppingCart className="text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Massive Selection</h3>
                <p className="mt-2 text-base text-gray-500">
                  Millions of products from thousands of trusted sellers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className={`rounded-lg p-6 bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
                  <FiTrendingUp className="text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Personalized Recommendations</h3>
                <p className="mt-2 text-base text-gray-500">
                  Get suggestions that match your interests and shopping habits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;