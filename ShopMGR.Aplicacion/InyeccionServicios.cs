using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion
{
    public static class InyeccionServicios
    {
        public static IServiceCollection InyectarServicios(this IServiceCollection services)
        {
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            services.AddScoped<IRepositorioCliente<Cliente>, ClienteRepositorio>();
            services.AddScoped<IAdministrarClientes, AdministracionClientes>();
            services.AddScoped<IRepositorioConCliente<Direccion>, DireccionRepositorio>();
            services.AddScoped<IAdministrarDireccion, AdministracionDireccion>();
            services.AddScoped<IRepositorioConCliente<TelefonoCliente>, TelefonoClienteRepositorio>();
            services.AddScoped<IAdministrarTelefonoCliente, AdministracionTelefonoCliente>();
            services.AddScoped<IRepositorioConEstado<Presupuesto, EstadoPresupuesto>, PresupuestoRepositorio>();
            services.AddScoped<IAdministrarPresupuestos, AdministracionPresupuestos>();
            services.AddScoped<IRepositorioConEstado<Trabajo, EstadoTrabajo>, TrabajoRepositorio>();
            services.AddScoped<IAdministrarTrabajos, AdministracionTrabajos>();


            return services;
        }
    }
}
