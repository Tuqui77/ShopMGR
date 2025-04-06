using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class TrabajoProfile : Profile
    {
        public TrabajoProfile()
        {
            CreateMap<Trabajo, TrabajoDTO>();
            CreateMap<TrabajoDTO, Trabajo>();
        }
    }
}
