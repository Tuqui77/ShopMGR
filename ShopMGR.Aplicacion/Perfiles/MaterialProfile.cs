using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class MaterialProfile : Profile
    {
        public MaterialProfile()
        {
            CreateMap<Material, MaterialDTO>();
            CreateMap<MaterialDTO, Material>();
        }
    }
}
