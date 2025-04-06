using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionDireccion(IRepositorioConCliente<Direccion> direccionRepositorio, IMapper mapper) : IAdministrarDireccion
    {
        private readonly IRepositorioConCliente<Direccion> _direccionRepositorio = direccionRepositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Direccion> CrearAsync(DireccionDTO nuevaDireccion)
        {
            var direccion = _mapper.Map<Direccion>(nuevaDireccion);

            await _direccionRepositorio.CrearAsync(direccion);

            return direccion;
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
            direccionDB.Descripcion = direccionActualizada.Descripcion ?? direccionDB.Descripcion;

            await _direccionRepositorio.ActualizarAsync(direccionDB);
        }

        public async Task EliminarAsync(int idDireccion)
        {
            await _direccionRepositorio.EliminarAsync(idDireccion);
        }
    }
}
