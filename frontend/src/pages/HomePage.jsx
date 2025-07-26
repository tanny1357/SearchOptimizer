function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
        Welcome to Flipkart
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mb-8">
        Search millions of products with our AI-powered semantic search engine
      </p>
    </div>
  );
}

export default HomePage;