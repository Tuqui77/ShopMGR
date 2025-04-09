using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionTrabajos(IRepositorioConEstado<Trabajo, EstadoTrabajo> repositorio, IMapper mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorioConEstado<Trabajo, EstadoTrabajo> _repositorio = repositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO entidad)
        {
            var trabajo = _mapper.Map<Trabajo>(entidad);
            if (entidad.Estado == EstadoTrabajo.Iniciado)
            {
                trabajo.FechaInicio = DateTime.Now;
            }
            else if (entidad.Estado == null)
            {
                trabajo.Estado = EstadoTrabajo.Pendiente;
            }

            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }

        public async Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            return await _repositorio.ObtenerPorIdAsync(id);
        }

        public async Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado)
        {
            return await _repositorio.ObtenerPorEstadoAsync(estado);
        }

        public async Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente)
        {
            return await _repositorio.ObtenerPorClienteAsync(idCliente);
        }

        public async Task ActualizarAsync(int id, ModificarTrabajo entidad)
        {
            var trabajoDB = await _repositorio.ObtenerPorIdAsync(id);

            if (entidad.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDB.FechaInicio = DateTime.Now;
            }
            trabajoDB.IdCliente = entidad.IdCliente ?? trabajoDB.IdCliente;
            trabajoDB.Titulo = entidad.Titulo ?? trabajoDB.Titulo;
            trabajoDB.Estado = entidad.Estado ?? trabajoDB.Estado;
            trabajoDB.IdPresupuesto = entidad.IdPresupuesto ?? trabajoDB.IdPresupuesto;

            await _repositorio.ActualizarAsync(trabajoDB);
        }

        public async Task EliminarAsync(int idTrabajo)
        {
            await _repositorio.EliminarAsync(idTrabajo);
        }
    }
}
