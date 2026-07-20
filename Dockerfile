# Use the Node.js image for building the application
FROM node:22 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Use the Nginx image for serving the application
FROM nginx:latest

# Copy built application from the build stage to the Nginx HTML folder
COPY --from=build /app/dist/frontend/browser/ /usr/share/nginx/html/

# Copy Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf
