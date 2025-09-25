using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class TelefonoMapper : IMapper<TelefonoCliente, TelefonoClienteDTO>
{
    public TelefonoClienteDTO Map(TelefonoCliente telefono)
    {
        return new TelefonoClienteDTO
        {
            IdCliente = telefono.IdCliente,
            Telefono = telefono.Telefono,
            Descripcion = telefono.Descripcion,
        };
    }
}

public class TelefonoDTOMapper : IMapper<TelefonoClienteDTO, TelefonoCliente>
{
    public TelefonoCliente Map(TelefonoClienteDTO telefonoDTO)
    {
        return new TelefonoCliente
        {
            IdCliente = telefonoDTO.IdCliente,
            Telefono = telefonoDTO.Telefono,
            Descripcion = telefonoDTO.Descripcion,
        };
    }
}