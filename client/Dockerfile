# Use Node.js image with your desired version
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the React app
CMD [ "sh", "-c", "npm start" ]