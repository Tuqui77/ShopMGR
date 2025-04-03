using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Perfiles
{
    public class PresupuestoProfile : Profile
    {
        public PresupuestoProfile()
        {
            CreateMap<Presupuesto, PresupuestoDTO>();
            CreateMap<PresupuestoDTO, Presupuesto>();
        }
    }
}
