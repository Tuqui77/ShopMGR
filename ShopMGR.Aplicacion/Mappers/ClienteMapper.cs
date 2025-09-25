using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class ClienteMapper : IMapper<ClienteDTO, Cliente>
{
    public Cliente Map(ClienteDTO clienteDTO)
    {
        return new Cliente
        {
            NombreCompleto = clienteDTO.NombreCompleto,
            Cuit = clienteDTO.Cuit,
            Balance = clienteDTO.Balance,
            // Direccion = clienteDTO.Direccion,
            // Telefono = clienteDTO.Telefono
        };
    }
}

public class ClienteDTOMapper :IMapper<Cliente, ClienteDTO>
{
    public ClienteDTO Map(Cliente cliente)
    {
        return new ClienteDTO
        {
            NombreCompleto = cliente.NombreCompleto,
            Cuit = cliente.Cuit,
            Balance = cliente.Balance,
            // TODO: mapear direccion y teléfono con un mapeador
            // Direccion = cliente.Direccion,
            // Telefono = cliente.Telefono
        };
    }
}

// TODO: Editor de clientes