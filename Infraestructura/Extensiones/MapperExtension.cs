using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Dominio.Abstracciones;

namespace Extensiones;

public static class MapperExtension
{
    public static IServiceCollection AddMappersFromAssembly(
        this IServiceCollection services,
        params Type[] types)
    {
        var assemblies = types.Select(t => t.Assembly).Distinct();

        foreach (var assembly in assemblies)
        {
            var mappers = assembly.GetTypes()
                .Where(t => !t.IsAbstract && !t.IsInterface) //Filtra las clases abstractas e interfaces
                .SelectMany(t => t.GetInterfaces() //Obtiene las interfaces que implementan
                    .Where(i => i.IsGenericType &&
                                i.GetGenericTypeDefinition() == typeof(IMapper<,>)) //Se queda solo con las que implementan IMapper
                    .Select(i => new { Service = i, Implementation = t })); //Devuelve pares de Service(IMapper<,>) y Implementation(los mappers de cada entidad)

            foreach (var mapper in mappers)
            {
                services.AddScoped(mapper.Service, mapper.Implementation);
            }
        }
        
        return services;
    }
}