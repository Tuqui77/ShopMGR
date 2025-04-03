using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
