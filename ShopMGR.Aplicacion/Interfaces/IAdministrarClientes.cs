using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarClientes : IAdministrarEntidades<Cliente, ClienteDTO, ModificarCliente>
    {
        public Task<Cliente> ObtenerClientePorNombre(string nombre);
        public Task<List<Cliente>> ListarTodosAsync();
    }
}
