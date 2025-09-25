using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class HorasMapper : IMapper<HorasYDescripcion, HorasYDescripcionDTO>
{
    public HorasYDescripcionDTO Map(HorasYDescripcion horas)
    {
        return new HorasYDescripcionDTO
        {
            Descripcion = horas.Descripcion,
            Horas = horas.Horas,
            Fecha = horas.Fecha,
            IdTrabajo = horas.IdTrabajo,
        };
    }
}

public class HorasDTOMapper : IMapper<HorasYDescripcionDTO, HorasYDescripcion>
{
    public HorasYDescripcion Map(HorasYDescripcionDTO horasDTO)
    {
        return new HorasYDescripcion
        {
            Descripcion = horasDTO.Descripcion,
            Horas = horasDTO.Horas,
            Fecha = horasDTO.Fecha,
            IdTrabajo = horasDTO.IdTrabajo
        };
    }
}