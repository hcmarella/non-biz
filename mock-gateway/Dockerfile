# Stand-in for forge-api-gateway until the real service is available.
# Swap this for the real gateway's image/build context in docker-compose.yml
# when it exists — no dependency-free Node code here to replace, just the service.
FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./
EXPOSE 8787
CMD ["node", "server.mjs"]
