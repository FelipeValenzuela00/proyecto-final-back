FROM node:20-slim

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node . .

RUN mkdir -p logs && chown -R node:node logs

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
