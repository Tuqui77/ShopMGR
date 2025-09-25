using Riok.Mapperly.Abstractions;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Mappers;

public class MaterialMapper : IMapper<Material, MaterialDTO>
{
    public MaterialDTO Map(Material material)
    {
        return new MaterialDTO
        {
            Descripcion = material.Descripcion,
            Precio = material.Precio,
            Cantidad = material.Cantidad
        };
    }
}

public class MaterialDTOMapper : IMapper<MaterialDTO, Material>
{
    public Material Map(MaterialDTO materialDTO)
    {
        return new Material
        {
            Descripcion = materialDTO.Descripcion,
            Precio = materialDTO.Precio,
            Cantidad = materialDTO.Cantidad
        };
    }
}