FROM node:22-alpine

WORKDIR /home
COPY . .
RUN npm install
RUN npm install pm2 -g
EXPOSE 8000:8080
CMD [ "pm2", "start", "server.js"]