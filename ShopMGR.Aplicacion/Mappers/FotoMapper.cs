using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class FotoMapper : IMapper<Foto, FotoDTO>
{
    public FotoDTO Map(Foto foto)
    {
        return new FotoDTO
        {
            IdTrabajo = foto.IdTrabajo,
            RutaCompleta = foto.RutaRelativa,
        };
    }
}

public class FotoDTOMapper : IMapper<FotoDTO, Foto>
{
    public Foto Map(FotoDTO fotoDTO)
    {
        return new Foto(fotoDTO.IdTrabajo, fotoDTO.RutaCompleta);
    }
}