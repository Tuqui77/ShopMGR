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
    public class AdministracionDireccion(DireccionRepositorio direccionRepositorio) : IAdministrarDireccion
    {
        private readonly DireccionRepositorio _direccionRepositorio = direccionRepositorio;

        public async Task CrearAsync(DireccionDTO nuevaDireccion)
        {
            var direccion = new Direccion
            {
                IdCliente = nuevaDireccion.IdCliente,
                Calle = nuevaDireccion.Calle,
                Altura = nuevaDireccion.Altura,
                Piso = nuevaDireccion.Piso,
                Departamento = nuevaDireccion.Departamento,
                CodigoPostal = nuevaDireccion.CodigoPostal
            };

            await _direccionRepositorio.CrearAsync(direccion);
        }

        public async Task<Direccion> ObtenerPorIdAsync(int idDireccion)
        {
            return await _direccionRepositorio.ObtenerPorIdAsync(idDireccion);
        }

        public async Task<List<Direccion>> ObtenerPorIdCliente(int idCliente)
        {
            return await _direccionRepositorio.ObtenerPorIdCliente(idCliente);
        }

        public async Task ActualizarAsync(int idDireccion, ModificarDireccion direccionActualizada)
        {
            var direccionDB = await _direccionRepositorio.ObtenerPorIdAsync(idDireccion);

            direccionDB.IdCliente = direccionActualizada.IdCliente ?? direccionDB.IdCliente;
            direccionDB.Calle = direccionActualizada.Calle ?? direccionDB.Calle;
            direccionDB.Altura = direccionActualizada.Altura ?? direccionDB.Altura;
            direccionDB.Piso = direccionActualizada.Piso ?? direccionDB.Piso;
            direccionDB.Departamento = direccionActualizada.Departamento ?? direccionDB.Departamento;
            direccionDB.CodigoPostal = direccionActualizada.CodigoPostal ?? direccionDB.CodigoPostal;

            await _direccionRepositorio.ActualizarAsync(direccionDB);
        }

        public async Task EliminarAsync(int idDireccion)
        {
            var direccionDB = await _direccionRepositorio.ObtenerPorIdAsync(idDireccion);
            await _direccionRepositorio.EliminarAsync(direccionDB);
        }
    }
}
