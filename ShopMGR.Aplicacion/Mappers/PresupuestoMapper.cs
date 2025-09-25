using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class PresupuestoMapper : IMapper<Presupuesto, PresupuestoDTO>
{
    public PresupuestoDTO Map(Presupuesto presupuesto)
    {
        return new PresupuestoDTO
        {
            Titulo = presupuesto.Titulo,
            Descripcion = presupuesto.Descripcion,
            // TODO: mapear materiales
            // Materiales = presupuesto.Materiales,
            HorasEstimadas = presupuesto.HorasEstimadas,
        };
    }
}

public class PresupuestoDTOMapper : IMapper<PresupuestoDTO, Presupuesto>
{
    public Presupuesto Map(PresupuestoDTO presupuestoDTO)
    {
        return new Presupuesto
        {
            Titulo = presupuestoDTO.Titulo,
            Descripcion = presupuestoDTO.Descripcion,
            // Materiales = presupuestoDTO.Materiales
            HorasEstimadas = presupuestoDTO.HorasEstimadas,
        };
    }
}