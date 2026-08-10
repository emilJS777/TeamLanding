FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm test && npm run build

FROM nginx:1.28-alpine
COPY --from=build /app/dist /srv/site/current

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
