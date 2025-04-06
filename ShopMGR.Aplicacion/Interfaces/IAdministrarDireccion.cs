using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarDireccion : IAdministrarEntidades<Direccion, DireccionDTO, ModificarDireccion>
    {
        public Task<List<Direccion>> ObtenerPorIdCliente(int idCliente);
    }
}
