using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionDireccion(
        IRepositorioConCliente<Direccion> direccionRepositorio,
        MapperRegistry mapper
    ) : IAdministrarDireccion
    {
        private readonly IRepositorioConCliente<Direccion> _direccionRepositorio =
            direccionRepositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Direccion> CrearAsync(DireccionDTO nuevaDireccion)
        {
            var direccion = _mapper.Map<DireccionDTO, Direccion>(nuevaDireccion);

            return await _direccionRepositorio.CrearAsync(direccion);
        }

        public async Task<Direccion> ObtenerPorIdAsync(int idDireccion)
        {
            return await _direccionRepositorio.ObtenerPorIdAsync(idDireccion);
        }

        public async Task<Direccion> ObtenerDetallePorIdAsync(int idDireccion)
        {
            return await _direccionRepositorio.ObtenerDetallePorIdAsync(idDireccion);
        }

        public async Task<List<Direccion>> ObtenerPorIdCliente(int idCliente)
        {
            return await _direccionRepositorio.ObtenerPorIdCliente(idCliente);
        }

        public async Task ActualizarAsync(int idDireccion, ModificarDireccion direccionActualizada)
        {
            var direccionBd = await _direccionRepositorio.ObtenerPorIdAsync(idDireccion);

            direccionBd.Calle = direccionActualizada.Calle;
            direccionBd.Altura = direccionActualizada.Altura;
            direccionBd.Piso = direccionActualizada.Piso;
            direccionBd.Departamento = direccionActualizada.Departamento;
            direccionBd.CodigoPostal = direccionActualizada.CodigoPostal;
            direccionBd.Ciudad = direccionActualizada.Ciudad;
            direccionBd.Descripcion = direccionActualizada.Descripcion;

            await _direccionRepositorio.ActualizarAsync(direccionBd);
        }

        public async Task EliminarAsync(int idDireccion)
        {
            await _direccionRepositorio.EliminarAsync(idDireccion);
        }
    }
}
