using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionTelefonoCliente : IAdministrarTelefonoCliente
    {
        private readonly TelefonoClienteRepositorio _telefonoClienteRepositorio;

        public AdministracionTelefonoCliente(TelefonoClienteRepositorio telefonoClienteRepositorio)
        {
            _telefonoClienteRepositorio = telefonoClienteRepositorio;
        }

        public async Task CrearAsync(TelefonoClienteDTO nuevoTelefono)
        {
            var telefono = new TelefonoCliente
            {
                IdCliente = nuevoTelefono.IdCliente,
                Telefono = nuevoTelefono.Telefono,
                Descripcion = nuevoTelefono.Descripcion
            };

            await _telefonoClienteRepositorio.CrearAsync(telefono);
        }

        public async Task<TelefonoCliente> ObtenerPorIdAsync(int idTelefono)
        {
            var telefono = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono) 
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");
            return telefono;
        }

        public async Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int idCliente)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdCliente(idCliente);
        }
        public async Task ActualizarAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            var telefonoDB = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono) 
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");

            telefonoDB.IdCliente = telefonoModificado.IdCliente ?? telefonoDB.IdCliente;
            telefonoDB.Telefono = telefonoModificado.Telefono ?? telefonoDB.Telefono;
            telefonoDB.Descripcion = telefonoModificado.Descripcion ?? telefonoDB.Descripcion;

            await _telefonoClienteRepositorio.ActualizarAsync(telefonoDB);
        }
        public async Task EliminarAsync(int idTelefono)
        {
            var telefono = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono)
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");

            await _telefonoClienteRepositorio.EliminarAsync(telefono);
        }




    }
}
