import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SuggestionsList from '../components/SuggestionsList';
import axios from 'axios';
import _ from 'lodash';
import { FaCamera } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';

function Navbar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const fetchSuggestions = useCallback(
    _.debounce(async (input) => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/search', {
          params: { query: input },
        });
        setSuggestions(res.data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (query.trim()) fetchSuggestions(query);
    else setSuggestions([]);
    return () => fetchSuggestions.cancel && fetchSuggestions.cancel();
  }, [query, fetchSuggestions]);

  const handleSubmit = (e) => {
    e && e.preventDefault();
    const searchText = query.trim();
    if (searchText) {
      navigate(`/search?query=${encodeURIComponent(searchText)}`);
      setSuggestions([]);
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
        handleSubmit();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  // Shared button styling
  const btnClass = `flex items-center justify-center h-11 w-11 p-0 rounded-none 
    bg-yellow-500 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 
    transition-colors duration-200 text-gray-800 text-lg border-0`;

  return (
    <header className={`bg-blue-600 text-white px-6 py-4 shadow sticky top-0 z-50 ${isHomePage ? 'bg-opacity-90' : ''}`}>
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-white hover:text-yellow-300 transition-colors">
          SearchOptimizer
        </Link>
        
        {/* Only show search on non-homepage routes */}
        {!isHomePage && (
          <form onSubmit={handleSubmit} className="flex-grow max-w-2xl relative">
            <div className="flex w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-4 py-2 rounded-l-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <label className={btnClass}>
                <FaCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <button type="submit" className={`${btnClass} rounded-r-md`}>
                <FiSearch />
              </button>
            </div>
            {suggestions.length > 0 && (
              <SuggestionsList 
                suggestions={suggestions} 
                onSelect={(text) => {
                  setQuery(text);
                  handleSubmit();
                }} 
              />
            )}
          </form>
        )}
        
        <div className="flex items-center space-x-4">
          <Link to="/categories" className="hover:text-yellow-300 transition-colors">
            Categories
          </Link>
          <Link to="/cart" className="hover:text-yellow-300 transition-colors">
            Cart
          </Link>
          <Link to="/account" className="hover:text-yellow-300 transition-colors">
            Account
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
