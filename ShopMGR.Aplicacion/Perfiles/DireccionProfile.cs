using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class DireccionProfile : Profile
    {
        public DireccionProfile()
        {
            CreateMap<Direccion, DireccionDTO>();
            CreateMap<DireccionDTO, Direccion>();
        }
    }
}
