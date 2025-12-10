# Etapa 1: Recursos
FROM node:20 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

ARG API_HOST=localhost
ARG API_PORT=8443
ARG API_BASE=/api
ARG API_PROTOCOL=https

COPY . .

# Sobrescribir archivo .env.production con las variables ARG
RUN echo "VITE_API_HOST=${API_HOST}" > .env.production && \
    echo "VITE_API_PORT=${API_PORT}" >> .env.production && \
    echo "VITE_API_BASE=${API_BASE}" >> .env.production && \
    echo "VITE_API_PROTOCOL=${API_PROTOCOL}" >> .env.production

RUN npm run build

# Etapa 2: Imagen
FROM nginx:alpine

# Copiar archivos del build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]