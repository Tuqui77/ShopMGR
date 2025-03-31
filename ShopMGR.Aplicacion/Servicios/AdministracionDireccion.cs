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

        //eliminar
        //actualizar
        //buscar 

    }
}
