using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class TelefonoClienteProfile : Profile
    {
        public TelefonoClienteProfile()
        {
            CreateMap<TelefonoCliente, TelefonoClienteDTO>();
            CreateMap<TelefonoClienteDTO, TelefonoCliente>();
        }
    }
}
