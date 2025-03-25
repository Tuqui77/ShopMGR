using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion
{
    public static class InyeccionServicios
    {
        public static IServiceCollection InyectarServicios(this IServiceCollection services)
        {
            services.AddScoped<ClienteRepositorio>();
            services.AddScoped<AdministracionClientes>();
            services.AddScoped<DireccionRepositorio>();
            services.AddScoped<AdministracionDireccion>();
            return services;
        }
    }
}
