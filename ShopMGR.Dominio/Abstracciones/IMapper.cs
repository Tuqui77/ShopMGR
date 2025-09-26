namespace ShopMGR.Dominio.Abstracciones;
// TODO: Covariante y contravariante, usos y beneficios.

public interface IMapper<TOrigen, TDestino>
{
    TDestino Map(TOrigen origen);

    IEnumerable<TDestino> Map(IEnumerable<TOrigen> origen)
    {
        return origen.Select(Map);
    }
}