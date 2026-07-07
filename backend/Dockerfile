FROM node:18-alpine

# Installer Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
