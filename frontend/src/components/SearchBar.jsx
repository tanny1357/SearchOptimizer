import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { dummySuggestions } from '../data/suggestionsData';
import SuggestionsList from './SuggestionsList';

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

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <input
  className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
  type="text"
  placeholder="Search for products..."
  value={input}
  onChange={(e) => setInput(e.target.value)}
/>

      <SuggestionsList suggestions={suggestions} onSelect={handleSelect} />
    </div>
  );
}

export default SearchBar;