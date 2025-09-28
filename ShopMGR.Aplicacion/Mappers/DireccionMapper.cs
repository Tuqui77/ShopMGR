using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class DireccionMapper : IMapper<Direccion, DireccionDTO>
{
    public DireccionDTO Map(Direccion direccion)
    {
        return new DireccionDTO
        {
            IdCliente = direccion.IdCliente,
            Calle = direccion.Calle,
            Altura = direccion.Altura,
            Piso = direccion.Piso,
            Departamento = direccion.Departamento,
            Descripcion = direccion.Descripcion,
            CodigoPostal = direccion.CodigoPostal,
            MapsID = direccion.MapsID
        };
    }
}

public class DireccionDTOMapper : IMapper<DireccionDTO, Direccion>
{
    public Direccion Map(DireccionDTO direccionDTO)
    {
        return new Direccion
        {
            IdCliente = direccionDTO.IdCliente,
            Calle = direccionDTO.Calle,
            Altura = direccionDTO.Altura,
            Piso = direccionDTO.Piso,
            Departamento = direccionDTO.Departamento,
            Descripcion = direccionDTO.Descripcion,
            CodigoPostal = direccionDTO.CodigoPostal,
            MapsID = direccionDTO.MapsID
        };
    }
}