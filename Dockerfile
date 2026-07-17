# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env

#Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

#Copia los archivos de proyecto y restaura las dependencias
COPY *.csproj ./
RUN --mount=type=cache,target=/root/.nuget/packages dotnet restore

#Copia los archivos restantes y construye la imagen
COPY . ./
RUN dotnet publish ShopMGR.WebApi.csproj -c Release -o out
RUN dotnet publish DBSeeder/DBSeeder.csproj -c Release -o dbseed-out

#Construye la imagen de runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime-env
WORKDIR /app
COPY --from=build-env /app/out .

#Configura el punto de entrada
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "ShopMGR.WebApi.dll"]
