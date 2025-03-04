FROM node:21-alpine

RUN apk add --no-cache python3 make g++
ENV PYTHON=/usr/bin/python3

RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json ./
RUN npm install

# Copy the rest of the files
COPY . .

# Expose the internal port
EXPOSE 9000

# Start the Express app
CMD ["node", "server.js"]
