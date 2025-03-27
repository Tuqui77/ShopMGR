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
        #region viejo
        //public static Direccion CrearDireccion(string calle, string altura, string codigoPostal = "2452", string? piso = null, string? departamento = null)
        //{
        //    Direccion direccion = new();
        //    direccion.Calle = calle;
        //    direccion.Altura = altura;
        //    direccion.Piso = piso;
        //    direccion.Departamento = departamento;
        //    direccion.CodigoPostal = codigoPostal;

        //    return direccion;
        //}
        #endregion

        private readonly DireccionRepositorio _direccionRepositorio;

        public AdministracionDireccion(DireccionRepositorio direccionRepositorio)
        {
            _direccionRepositorio = direccionRepositorio;
        }

        public async Task CrearDireccionAsync(DireccionDTO nuevaDireccion)
        {
            if (await _direccionRepositorio.ObtenerPorCalleYAlturaAsync(nuevaDireccion.Calle, nuevaDireccion.Altura) != null)
                throw new ArgumentException("Ya existe una dirección con esa calle y altura");
            
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



    }
}
