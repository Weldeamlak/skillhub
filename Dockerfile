FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
`