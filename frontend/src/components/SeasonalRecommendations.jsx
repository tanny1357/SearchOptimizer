import React from 'react';
import { FaLeaf, FaSnowflake, FaSun, FaCloudRain } from 'react-icons/fa';

const SeasonalRecommendations = ({ recommendations, season, month, query, relevantCount, fallbackCount, hasFallback }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getSeasonIcon = (season) => {
    switch (season?.toLowerCase()) {
      case 'spring':
        return <FaLeaf className="text-green-500" />;
      case 'summer':
        return <FaSun className="text-yellow-500" />;
      case 'winter':
        return <FaSnowflake className="text-blue-500" />;
      case 'monsoon':
      case 'post-monsoon':
        return <FaCloudRain className="text-blue-400" />;
      default:
        return <FaLeaf className="text-green-500" />;
    }
  };

  const getSeasonColor = (season) => {
    switch (season?.toLowerCase()) {
      case 'spring':
        return 'border-green-200 bg-green-50';
      case 'summer':
        return 'border-yellow-200 bg-yellow-50';
      case 'winter':
        return 'border-blue-200 bg-blue-50';
      case 'monsoon':
      case 'post-monsoon':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Separate relevant and fallback recommendations
  const relevantRecs = recommendations.filter(item => !item.is_fallback);
  const fallbackRecs = recommendations.filter(item => item.is_fallback);

  return (
    <div className={`mt-8 p-6 rounded-lg border-2 ${getSeasonColor(season)}`}>
      <div className="flex items-center mb-4">
        {getSeasonIcon(season)}
        <h3 className="text-xl font-semibold ml-2">
          Products for {month}
        </h3>
      </div>
      
      {relevantRecs.length > 0 ? (
        <p className="text-sm text-gray-600 mb-4">
          Here are some seasonal products trending this month:
        </p>
      ) : (
        <p className="text-sm text-gray-600 mb-4">
          No direct matches for "{query}" this season, but here are popular {season.toLowerCase()} products for {month}:
        </p>
      )}

      {/* Relevant Recommendations */}
      {relevantRecs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {relevantRecs.map((item, index) => (
              <div
                key={`relevant-${index}`}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {item.image && (
                  <div className="mb-3">
                    <img 
                      src={item.image} 
                      alt={item.title || item.product}
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {e.target.style.display = 'none'}}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800 text-sm leading-tight">
                    {item.title || item.product}
                  </h4>
                  {/* <span className="text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                    {item.match_percentage}
                  </span> */}
                </div>
                
                {item.brand && (
                  <p className="text-xs text-gray-500 mb-2">Brand: {item.brand}</p>
                )}
                
                {item.price && (
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    ₹{item.price.toLocaleString()}
                    {item.retail_price && item.retail_price > item.price && (
                      <span className="text-xs text-gray-500 line-through ml-2">
                        ₹{item.retail_price.toLocaleString()}
                      </span>
                    )}
                  </p>
                )}
                
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default SeasonalRecommendations;
