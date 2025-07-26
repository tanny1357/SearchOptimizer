// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the gridProject database
db = db.getSiblingDB('gridProject');

// Create collections with some basic structure
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('brands');
db.createCollection('orders');
db.createCollection('reviews');
db.createCollection('searchhistories');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "brand": 1 });
db.reviews.createIndex({ "productId": 1 });
db.searchhistories.createIndex({ "userId": 1 });

// Insert sample data
db.categories.insertMany([
  { _id: ObjectId(), name: "Electronics", description: "Electronic devices and accessories" },
  { _id: ObjectId(), name: "Mobile Phones", description: "Smartphones and mobile devices" },
  { _id: ObjectId(), name: "Laptops", description: "Laptops and computers" }
]);

db.brands.insertMany([
  { _id: ObjectId(), name: "Samsung", description: "Samsung Electronics" },
  { _id: ObjectId(), name: "Apple", description: "Apple Inc." },
  { _id: ObjectId(), name: "Motorola", description: "Motorola Mobility" }
]);

print('Database initialization completed successfully!');