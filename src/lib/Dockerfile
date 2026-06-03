FROM mcr.microsoft.com/playwright:v1.44.0-jammy

USER root

# Memaksa sistem internal bot nunggu load WA Web selamanya (tanpa timeout)
ENV WAIT_FOR_FUNCTION_TIMEOUT=0
ENV AUTH_TIMEOUT_MS=600000

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN mkdir -p /home/pptruser/temp && chmod -R 777 /home/pptruser/temp

CMD ["node", "index.js"]
