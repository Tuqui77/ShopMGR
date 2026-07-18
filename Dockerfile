# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env

# Construir frontend
FROM node:22-alpine AS build-frontend
WORKDIR /app
COPY Frontend/package*.json ./
COPY Frontend/package-lock*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY Frontend/ .
RUN npm run build

# Construir backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-backend
WORKDIR /app
COPY *.csproj ./
RUN --mount=type=cache,target=/root/.nuget/packages dotnet restore
COPY . ./
RUN dotnet publish ShopMGR.WebApi.csproj -c Release -o out
# RUN dotnet publish DBSeeder/DBSeeder.csproj -c Release -o dbseed-out

#Construye la imagen de runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime-env
WORKDIR /app
COPY --from=build-backend /app/out .
COPY --from=build-frontend /app/dist ./wwwroot

#Configura el punto de entrada
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "ShopMGR.WebApi.dll"]
