using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class FotoMapper :IMapper<Foto, FotoDTO>
{
    public FotoDTO Map(Foto foto)
    {
        return new FotoDTO
        {
            IdTrabajo = foto.IdTrabajo,
            Enlace = foto.Enlace,
        };
    }
}

public class FotoDTOMapper : IMapper<FotoDTO, Foto>
{
    public Foto Map(FotoDTO fotoDTO)
    {
        return new Foto
        {
            IdTrabajo = fotoDTO.IdTrabajo,
            Enlace = fotoDTO.Enlace
        };
    }
}