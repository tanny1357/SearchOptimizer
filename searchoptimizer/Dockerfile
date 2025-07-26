# Multi-stage build for React app
FROM node:20-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built React app to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]