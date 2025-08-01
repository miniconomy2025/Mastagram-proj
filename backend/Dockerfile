ARG NODE_VERSION=22.13.1

FROM node:${NODE_VERSION}-alpine

USER node

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY . .

RUN ["npm", "install"]

EXPOSE 3500

CMD ["npm", "run", "prod"]
