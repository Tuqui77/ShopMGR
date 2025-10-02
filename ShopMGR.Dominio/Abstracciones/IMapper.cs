namespace ShopMGR.Dominio.Abstracciones;

public interface IMapper<TOrigen, TDestino>
{
    TDestino Map(TOrigen origen);

    IEnumerable<TDestino> Map(IEnumerable<TOrigen> origen)
    {
        return origen.Select(Map);
    }
}