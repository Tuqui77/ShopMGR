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
            if (await _telefonoClienteRepositorio.ObtenerPorNumeroAsync(nuevoTelefono.Telefono) != null)
                throw new ArgumentException("Ya existe un teléfono con ese número");

            var telefono = new TelefonoCliente
            {
                IdCliente = nuevoTelefono.IdCliente,
                Telefono = nuevoTelefono.Telefono,
                Descripcion = nuevoTelefono.Descripcion
            };

            await _telefonoClienteRepositorio.CrearAsync(telefono);
        }

        public async Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int idCliente)
        {
            return await _telefonoClienteRepositorio.BuscarPorIdCliente(idCliente);
        }
    }
}
