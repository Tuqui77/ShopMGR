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
    public class AdministracionDireccion
    {
        private readonly DireccionRepositorio _direccionRepositorio;

        public AdministracionDireccion(DireccionRepositorio direccionRepositorio)
        {
            _direccionRepositorio = direccionRepositorio;
        }

        public async Task CrearDireccionAsync(DireccionDTO nuevaDireccion)
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

            await _direccionRepositorio.CrearDireccionAsync(direccion);
        }

        public async Task<List<Direccion>> BuscarPorIdCliente(int idCliente)
        {
            return await _direccionRepositorio.BuscarPorIdCliente(idCliente);
        }

        public async Task ActualizarDireccionAsync(int idDireccion, ModificarDireccion direccionActualizada)
        {
            var direccionDB = await _direccionRepositorio.ObtenerPorIdDireccion(idDireccion);

            direccionDB.IdCliente = direccionActualizada.IdCliente ?? direccionDB.IdCliente;
            direccionDB.Calle = direccionActualizada.Calle ?? direccionDB.Calle;
            direccionDB.Altura = direccionActualizada.Altura ?? direccionDB.Altura;
            direccionDB.Piso = direccionActualizada.Piso ?? direccionDB.Piso;
            direccionDB.Departamento = direccionActualizada.Departamento ?? direccionDB.Departamento;
            direccionDB.CodigoPostal = direccionActualizada.CodigoPostal ?? direccionDB.CodigoPostal;

            await _direccionRepositorio.ActualizarDireccionAsync(direccionDB);
        }

        public async Task EliminarDireccionAsync(int idDireccion)
        {
            var direccionDB = await _direccionRepositorio.ObtenerPorIdDireccion(idDireccion);
            await _direccionRepositorio.EliminarDireccionAsync(direccionDB);
        }
    }
}
