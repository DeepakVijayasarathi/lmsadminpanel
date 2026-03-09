# Stage 1: Build Angular
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --force
RUN npm install -g @angular/cli
COPY . .
RUN ng build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist/admin-panel/browser /usr/share/nginx/html

# SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
