# Dev-mode container for the Vite app, for the docker-compose network in
# ARCHITECTURE.md §5 stage 0. Build a separate production image (multi-stage
# `vite build` + static server) before promoting past local dev.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
