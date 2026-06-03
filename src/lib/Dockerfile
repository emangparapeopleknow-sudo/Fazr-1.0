FROM mcr.microsoft.com/playwright:v1.44.0-jammy

USER root

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Buat folder temp manual untuk database yang tadi sempat error
RUN mkdir -p /home/pptruser/temp && chmod -R 777 /home/pptruser/temp

CMD ["node", "index.js"]

