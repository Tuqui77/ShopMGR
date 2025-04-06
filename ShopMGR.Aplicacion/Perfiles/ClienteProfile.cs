using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class ClienteProfile : Profile
    {
        public ClienteProfile()
        {
            CreateMap<Cliente, ClienteDTO>();
            CreateMap<ClienteDTO, Cliente>();
        }
    }
}
