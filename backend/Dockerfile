ARG NODE_VERSION=22.13.1

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY . .

RUN npm install -g migrate-mongo
RUN npm install

USER node

EXPOSE 8000

CMD ["sh", "start.sh"]
