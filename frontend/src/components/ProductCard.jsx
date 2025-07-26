export default function ProductCard({ product, viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
        
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-800">{product.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="font-bold">₹{(Math.random() * 10000).toFixed(2)}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {(product.score * 100).toFixed(2)}% match
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default grid view
  return (
    <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-40 mb-3" />
      
      <h3 className="text-lg font-medium text-gray-800">{product.title}</h3>
      <p className="text-sm text-gray-600 mt-1 flex-grow line-clamp-2">{product.description}</p>
      
      <div className="mt-3 flex justify-between items-center">
        <span className="font-bold">₹{(Math.random() * 10000).toFixed(2)}</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {(product.score * 100).toFixed(2)}% match
        </span>
      </div>
    </div>
  );
}