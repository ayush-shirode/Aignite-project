# Use official Node.js LTS image
FROM node:18

# Create app directory inside container
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy rest of the application code
COPY . .

# Expose backend port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
