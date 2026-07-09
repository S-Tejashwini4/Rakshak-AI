# Use the official Node.js image as the base image for the Custom OCI Runtime
FROM node:18-alpine

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install

# Bundle the application source code inside the Docker image
COPY . .

# The port is dynamically injected by Catalyst AppSail via X_ZOHO_CATALYST_LISTEN_PORT,
# but we expose a default port for local testing
EXPOSE 3000

# Command to run the application in the Catalyst AppSail container
CMD [ "node", "index.js" ]
