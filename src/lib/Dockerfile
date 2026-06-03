FROM ghcr.io/puppeteer/puppeteer:latest

# Ini maksudnya ngasih izin admin ke server Railway-nya, BUKAN HP LU
USER root

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Bikin folder database biar bot lu kagak error merah lagi
RUN mkdir -p /home/pptruser/temp && chmod -R 777 /home/pptruser/temp

CMD ["node", "index.js"]
