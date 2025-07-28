import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FaTh, FaList, FaFilter } from 'react-icons/fa';
import { fetchSpellCorrection } from '../api/spellCorrectionAPI';

function ResultsPage() {
  const [searchParams] = useSearchParams();
  const originalQuery = searchParams.get('query') || '';
  const [results, setResults] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // For spell correction
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [usedQuery, setUsedQuery] = useState(originalQuery);

  useEffect(() => {
    let cancelled = false;
    async function checkCorrection() {
      setCorrectedQuery(null);
      setUsedQuery(originalQuery);
      if (!originalQuery?.trim()) return;
      try {
        const { correction } = await fetchSpellCorrection(originalQuery);
        if (
          correction &&
          correction.trim().toLowerCase() !== originalQuery.trim().toLowerCase()
        ) {
          if (!cancelled) {
            setCorrectedQuery(correction);
            setUsedQuery(correction);
          }
        } else {
          if (!cancelled) {
            setCorrectedQuery(null);
            setUsedQuery(originalQuery);
          }
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
      axios.get('http://127.0.0.1:8000/search', {
        params: { query: usedQuery, semantic: true }
      }).then((res) => {
        setResults(res.data.results || []);
      });
    }
  }, [usedQuery]);

  return (
    <div className="flex flex-col lg:flex-row p-4 max-w-7xl mx-auto">
      {/* Sidebar */}
      <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block lg:w-64 mr-6 mb-4 lg:mb-0`}>
        <div className="bg-white p-4 rounded shadow-lg sticky top-24">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Filters</h3>
            <button
              onClick={() => setFiltersOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-gray-700">Category</h4>
            <ul className="space-y-1">
              {['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty'].map(cat => (
                <li key={cat} className="flex items-center">
                  <input type="checkbox" id={cat} className="mr-2" />
                  <label htmlFor={cat} className="text-sm">{cat}</label>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-gray-700">Price Range</h4>
            <div className="flex items-center space-x-2">
              <input type="number" placeholder="Min" className="w-full p-1 border rounded text-sm" />
              <span className="text-gray-500">to</span>
              <input type="number" placeholder="Max" className="w-full p-1 border rounded text-sm" />
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {correctedQuery && (
          <div className="mb-3 bg-yellow-100 border border-yellow-400 rounded p-2 text-yellow-800 text-sm">
            Showing results for <span className="font-semibold">{correctedQuery}</span> instead of <span className="italic">{originalQuery}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Results for: "<span className="text-blue-600">{usedQuery}</span>"
            </h2>
            <p className="text-sm text-gray-600">{results.length} products found</p>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <button
              className="lg:hidden bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded flex items-center"
              onClick={() => setFiltersOpen(true)}
            >
              <FaFilter className="mr-1" /> Filters
            </button>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                onClick={() => setViewMode('grid')}
              >
                <FaTh />
              </button>
              <button
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white'}`}
                onClick={() => setViewMode('list')}
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-lg text-gray-600">No matching results found for "{usedQuery}"</p>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className={`gap-4 ${viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'}`}>
            {results.map((p, idx) => (
              <ProductCard key={idx} product={p} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;