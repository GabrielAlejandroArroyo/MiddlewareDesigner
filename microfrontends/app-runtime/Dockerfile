# Stage 1: Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx ng build app-runtime --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist/app-runtime /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
