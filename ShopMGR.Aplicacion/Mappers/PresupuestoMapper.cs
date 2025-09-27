using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Contexto.Configuracion_entidades;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class PresupuestoMapper(MapperRegistry mapper) : IMapper<PresupuestoDTO, Presupuesto>
{
    private readonly MapperRegistry _mapper = mapper;
    
    public Presupuesto Map(PresupuestoDTO presupuestoDTO)
    {
        return new Presupuesto
        {
            Titulo = presupuestoDTO.Titulo,
            Descripcion = presupuestoDTO.Descripcion,
            Materiales = _mapper.Map<MaterialDTO, Material>(presupuestoDTO.Materiales).ToList(),
            HorasEstimadas = presupuestoDTO.HorasEstimadas,
        };
    }
}

public class PresupuestoDTOMapper(MapperRegistry mapper) : IMapper<Presupuesto, PresupuestoDTO>
{
    private readonly MapperRegistry _mapper = mapper;
    
    public PresupuestoDTO Map(Presupuesto presupuesto)
    {
        return new PresupuestoDTO
        {
            Titulo = presupuesto.Titulo,
            Descripcion = presupuesto.Descripcion,
            Materiales = _mapper.Map<Material, MaterialDTO>(presupuesto.Materiales).ToList(),
            HorasEstimadas = presupuesto.HorasEstimadas,
        };
    }
}