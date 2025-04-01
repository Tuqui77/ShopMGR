using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionTelefonoCliente
    {
        private readonly TelefonoClienteRepositorio _telefonoClienteRepositorio;

        public AdministracionTelefonoCliente(TelefonoClienteRepositorio telefonoClienteRepositorio)
        {
            _telefonoClienteRepositorio = telefonoClienteRepositorio;
        }

        public async Task CrearTelefonoClienteAsync(TelefonoClienteDTO nuevoTelefono)
        {
            var telefono = new TelefonoCliente
            {
                IdCliente = nuevoTelefono.IdCliente,
                Telefono = nuevoTelefono.Telefono,
                Descripcion = nuevoTelefono.Descripcion
            };

            await _telefonoClienteRepositorio.CrearTelefonoAsync(telefono);
        }

        public async Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int idCliente)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdCliente(idCliente);
        }

        public async Task<TelefonoCliente> ObtenerTelefonoClientePorId(int idTelefono)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono);
        }

        public async Task ModificarTelefonoClienteAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            var telefonoDB = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono);

            telefonoDB.IdCliente = telefonoModificado.IdCliente ?? telefonoDB.IdCliente;
            telefonoDB.Telefono = telefonoModificado.Telefono ?? telefonoDB.Telefono;
            telefonoDB.Descripcion = telefonoModificado.Descripcion ?? telefonoDB.Descripcion;

            await _telefonoClienteRepositorio.ModificarTelefonoAsync(telefonoDB);
        }

        public async Task EliminarTelefonoClienteAsync(int idTelefono)
        {
            var telefono = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono);
            await _telefonoClienteRepositorio.EliminarTelefonoAsync(telefono);
        }
    }
}
