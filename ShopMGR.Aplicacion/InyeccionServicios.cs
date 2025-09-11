using AutoMapper;
using Google.Apis.Drive.v3;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Perfiles;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Infraestructura.Drive;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion
{
    public static class InyeccionServicios
    {
        public static IServiceCollection InyectarServicios(this IServiceCollection services)
        {
            //Dependencias de entidades de la aplicación.
            services.AddScoped<IRepositorioCliente<Cliente>, ClienteRepositorio>();
            services.AddScoped<IAdministrarClientes, AdministracionClientes>();

            services.AddScoped<IRepositorioConCliente<Direccion>, DireccionRepositorio>();
            services.AddScoped<IAdministrarDireccion, AdministracionDireccion>();

            services.AddScoped<IRepositorioConCliente<TelefonoCliente>, TelefonoClienteRepositorio>();
            services.AddScoped<IAdministrarTelefonoCliente, AdministracionTelefonoCliente>();

            services.AddScoped<IRepositorioConValorHora, PresupuestoRepositorio>();
            services.AddScoped<IAdministrarPresupuestos, AdministracionPresupuestos>();

            services.AddScoped<IRepositorioConFoto, TrabajoRepositorio>();
            services.AddScoped<IAdministrarTrabajos, AdministracionTrabajos>();

            //Dependencias de almacenamiento en la nube.
            services.AddScoped<GoogleDriveClient>();
            services.AddScoped<IGoogleDriveServicio, GoogleDriveServicio>();
            services.AddScoped<DriveService>();

            //Herramientas adicionales
            //services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
            services.AddAutoMapper();

            return services;
        }
    }
}
