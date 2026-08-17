FROM node:22-alpine

WORKDIR /app
COPY package.json server.mjs styles.css fixtures.css ./
COPY *.html ./

ENV HOST=0.0.0.0
ENV PORT=4173
EXPOSE 4173

CMD ["npm", "run", "serve"]
