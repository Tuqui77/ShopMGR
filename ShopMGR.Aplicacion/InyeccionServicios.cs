using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion
{
    public static class InyeccionServicios
    {
        public static IServiceCollection InyectarServicios(this IServiceCollection services)
        {
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
            
            services.AddScoped<ClienteRepositorio>();
            services.AddScoped<AdministracionClientes>();
            services.AddScoped<DireccionRepositorio>();
            services.AddScoped<AdministracionDireccion>();
            services.AddScoped<TelefonoClienteRepositorio>();
            services.AddScoped<AdministracionTelefonoCliente>();
            services.AddScoped<PresupuestoRepositorio>();
            services.AddScoped<AdministracionPresupuestos>();
            return services;
        }
    }
}
