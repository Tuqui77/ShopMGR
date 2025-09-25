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
        return new Trabajo
        {
            Titulo = trabajoDTO.Titulo,
            IdCliente = trabajoDTO.IdCliente,
            IdPresupuesto = trabajoDTO.IdPresupuesto,
            Estado = trabajoDTO.Estado ?? EstadoTrabajo.Pendiente
        };
    }
}

