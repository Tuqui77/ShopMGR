using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarTelefonoCliente : IAdministrarEntidades<TelefonoCliente, TelefonoClienteDTO, ModificarTelefono>
    {
        public Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int Id);
    }
}
