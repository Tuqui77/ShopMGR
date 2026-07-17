# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY Frontend/package*.json ./
COPY Frontend/package-lock*.json ./

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source
COPY Frontend/ .

# Build
RUN npm run build

# Production image
FROM docker.io/library/nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
