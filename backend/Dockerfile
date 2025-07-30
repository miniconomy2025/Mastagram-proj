FROM node:20

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3500
CMD ["npm", "run", "start"]
