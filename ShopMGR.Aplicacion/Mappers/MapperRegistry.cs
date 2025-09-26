using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;

namespace ShopMGR.Aplicacion.Mappers;

public class MapperRegistry(IServiceProvider serviceProvider)
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;

    private IMapper<TOrigen, TDestino> Resolve<TOrigen, TDestino>()
    {
        var mapper = _serviceProvider.GetService(typeof(IMapper<TOrigen, TDestino>));
        
        return mapper as IMapper<TOrigen, TDestino> 
               ?? throw new InvalidOperationException($"No se encontró un mapeador de {typeof(TOrigen).Name} a {typeof(TDestino).Name}");
    }

    public TDestino Map<TOrigen, TDestino>(TOrigen origen)
    {
        return Resolve<TOrigen, TDestino>().Map(origen);
    }
}