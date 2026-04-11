using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Contexto.Configuracion_entidades;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class PresupuestoMapper(MapperRegistry mapper) : IMapper<PresupuestoDTOcreacion, Presupuesto>
{
    private readonly MapperRegistry _mapper = mapper;

    public Presupuesto Map(PresupuestoDTOcreacion presupuestoDTO)
    {
        return new Presupuesto
        {
            IdCliente = presupuestoDTO.IdCliente,
            Titulo = presupuestoDTO.Titulo,
            Descripcion = presupuestoDTO.Descripcion,
            Materiales = _mapper.Map<MaterialDTO, Material>(presupuestoDTO.Materiales).ToList(),
            HorasEstimadas = presupuestoDTO.HorasEstimadas,
        };
    }
}

public class PresupuestoDTOMapper(MapperRegistry mapper) : IMapper<Presupuesto, PresupuestoDTOcreacion>
{
    private readonly MapperRegistry _mapper = mapper;

    public PresupuestoDTOcreacion Map(Presupuesto presupuesto)
    {
        return new PresupuestoDTOcreacion
        {
            IdCliente = presupuesto.IdCliente,
            Titulo = presupuesto.Titulo,
            Descripcion = presupuesto.Descripcion,
            Materiales = _mapper.Map<Material, MaterialDTO>(presupuesto.Materiales).ToList(),
            HorasEstimadas = presupuesto.HorasEstimadas,
        };
    }
}
