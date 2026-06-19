using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class TrabajoMApper : IMapper<Trabajo, TrabajoDTO>
{
    public TrabajoDTO Map(Trabajo trabajo)
    {
        return new TrabajoDTO()
        {
            Titulo = trabajo.Titulo,
            Descripcion = trabajo.Descripcion,
            IdCliente = trabajo.IdCliente,
            IdPresupuesto = trabajo.IdPresupuesto,
            Estado = trabajo.Estado,
        };
    }
}

public class TrabajoDTOMapper : IMapper<TrabajoDTO, Trabajo>
{
    public Trabajo Map(TrabajoDTO trabajoDTO)
    {
        return new Trabajo(
            trabajoDTO.Titulo,
            trabajoDTO.Descripcion,
            trabajoDTO.IdCliente,
            trabajoDTO.Estado,
            trabajoDTO.IdPresupuesto,
            trabajoDTO.HorasEstimadas
        );
    }
}
