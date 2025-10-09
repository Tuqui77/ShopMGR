using Extensiones;
using Google.Apis.Drive.v3;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
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
            
            services.AddScoped<IMovimientoBalanceRepositorio, MovimientoBalanceRepoositorio>();

            //Dependencias de almacenamiento en la nube.
            services.AddScoped<GoogleDriveClient>();
            services.AddScoped<IGoogleDriveServicio, GoogleDriveServicio>();
            services.AddScoped<DriveService>();

            //Herramientas adicionales
            // Mapeadores manuales
            services.AddMappersFromAssembly(typeof(ClienteMapper));
            services.AddScoped<MapperRegistry>();
            
            return services;
        }
    }
}
