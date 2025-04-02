using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarTelefonoCliente : IAdministrarEntidades<TelefonoCliente, TelefonoClienteDTO, ModificarTelefono>
    {
        public Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int Id);
    }
}
