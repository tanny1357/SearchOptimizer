# SearchOptimizer

A full-stack web application for optimized search functionality with React frontend and Node.js backend.

## Project Structure

```
SearchOptimizer/
├── Backend/                 # Node.js Express API
│   ├── Models/             # Mongoose models
│   ├── db/                 # Database connection
│   ├── routes/             # API routes
│   ├── src/                # Source code
│   ├── Dockerfile          # Backend Docker configuration
│   └── package.json
├── searchoptimizer/        # React frontend
│   ├── src/               # React components and pages
│   ├── public/            # Static assets
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── nginx.conf         # Nginx configuration
│   └── package.json
├── docker-compose.yml      # Full stack deployment
├── mongo-init.js          # MongoDB initialization
└── .env.example           # Environment variables template
```

## Features

- **Backend API**: Express.js REST API with MongoDB
- **Frontend**: React SPA with React Router
- **Authentication**: JWT-based authentication
- **Search**: Advanced search and autocomplete functionality
- **Reviews**: Product review system
- **Containerization**: Full Docker support

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SearchOptimizer
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

## Development Setup

### Backend Development

```bash
cd Backend
npm install
npm run dev
```

### Frontend Development

```bash
cd searchoptimizer
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Search
- `GET /api/search/autosuggest` - Get search suggestions
- `GET /api/search` - Search products

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Reviews
- `GET /api/products/:productId/reviews` - Get product reviews
- `POST /api/products/:productId/reviews` - Create review
- `PUT /api/products/:productId/reviews/:id` - Update review
- `DELETE /api/products/:productId/reviews/:id` - Delete review

## Database Schema

### Collections
- `users` - User accounts
- `products` - Product catalog
- `categories` - Product categories
- `brands` - Product brands
- `orders` - User orders
- `reviews` - Product reviews
- `searchhistories` - Search history

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Remove all containers and volumes
docker-compose down -v --remove-orphans
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `MONGO_URI` - MongoDB connection string
- `PORT` - Backend server port
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT secret key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.