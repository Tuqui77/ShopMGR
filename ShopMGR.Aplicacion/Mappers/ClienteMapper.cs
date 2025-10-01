using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class ClienteMapper(MapperRegistry mapper) : IMapper<ClienteDTO, Cliente>
{
    private readonly MapperRegistry _mapper = mapper;
    
    public Cliente Map(ClienteDTO clienteDTO)
    {
        return new Cliente
        {
            NombreCompleto = clienteDTO.NombreCompleto,
            Cuit = clienteDTO.Cuit,
            Balance = clienteDTO.Balance,
        };
    }
}

public class ClienteDTOMapper(MapperRegistry mapper) :IMapper<Cliente, ClienteDTO>
{
    private readonly MapperRegistry _mapper = mapper;
    public ClienteDTO Map(Cliente cliente)
    {
        return new ClienteDTO
        {
            NombreCompleto = cliente.NombreCompleto,
            Cuit = cliente.Cuit,
            Balance = cliente.Balance,
            Direccion = _mapper.Map<Direccion, DireccionDTO>(cliente.Direccion).ToList(),
            Telefono = _mapper.Map<TelefonoCliente, TelefonoClienteDTO>(cliente.Telefono).ToList(),
        };
    }
}