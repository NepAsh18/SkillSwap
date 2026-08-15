FROM node:20

WORKDIR /frontend-web

# install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# copy source code
COPY . ./

EXPOSE 5173

CMD ["npm", "run", "dev"]