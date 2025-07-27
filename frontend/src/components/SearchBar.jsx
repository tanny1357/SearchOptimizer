import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { dummySuggestions } from '../data/suggestionsData';
import SuggestionsList from './SuggestionsList';
import { FaCamera } from 'react-icons/fa';

function SearchBar({ onSelectQuery }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    if (debouncedInput.length > 0) {
      const filtered = dummySuggestions.filter((q) =>
        q.toLowerCase().includes(debouncedInput.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [debouncedInput]);

  const handleSelect = (query) => {
    onSelectQuery(query);
    setInput('');
    setSuggestions([]);
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
      handleSelect(data.caption);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex items-center">
      <input
        className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="text"
        placeholder="Search for products..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <label className="ml-2 cursor-pointer">
        <FaCamera size={20} />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>
      <SuggestionsList suggestions={suggestions} onSelect={handleSelect} />
    </div>
  );
}

export default SearchBar;
