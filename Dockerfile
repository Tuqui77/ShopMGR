#Start with the base .NET SDK Image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env

#Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

#Copiar DBSeeder
COPY DBSeeder/ ./DBSeeder/

#Copia los archivos de proyecto y restaura las dependencias
COPY *.csproj ./
RUN dotnet restore

#Copia los archivos restantes y construye la imagen
COPY . ./
RUN dotnet publish ShopMGR.WebApi.csproj -c Release -o out
RUN dotnet publish DBSeeder/DBSeeder.csproj -c Release -o dbseed-out

#Construye la imagen de runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime-env
WORKDIR /app
COPY --from=build-env /app/out .
COPY --from=build-env /app/dbseed-out .

#Configura el punto de entrada
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "ShopMGR.WebApi.dll"]
