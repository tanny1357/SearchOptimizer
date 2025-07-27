import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SuggestionsList from '../components/SuggestionsList';
import axios from 'axios';
import _ from 'lodash';
import { FaCamera } from 'react-icons/fa';

function Navbar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const fetchSuggestions = useCallback(
    _.debounce(async (input) => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/search', {
          params: { query: input }
        });
        setSuggestions(res.data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query.trim()) fetchSuggestions(query);
    else setSuggestions([]);
    return () => fetchSuggestions.cancel && fetchSuggestions.cancel();
  }, [query, fetchSuggestions]);

  const handleSubmit = (text = query) => {
    const searchText = text.trim();
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

    const res = await fetch('http://127.0.0.1:8000/image-to-caption', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.caption) {
      setQuery(data.caption);
      handleSubmit(data.caption);
    }
  };

  return (
    <header className="bg-blue-600 text-white px-6 py-4 shadow sticky top-0 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
        <Link to="/" className="text-2xl font-bold cursor-pointer hover:text-yellow-300 transition-colors">
          Flipkart Grid
        </Link>

        <div className="flex-1 w-full max-w-2xl relative">
          <div className="flex items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="px-4 py-2 rounded-l-md w-full text-gray-800 bg-white outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <label className="bg-yellow-500 hover:bg-yellow-600 px-3 py-2 cursor-pointer">
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => handleSubmit()}
              className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <SuggestionsList
            suggestions={suggestions}
            onSelect={(s) => {
              setQuery(s);
              handleSubmit(s);
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
