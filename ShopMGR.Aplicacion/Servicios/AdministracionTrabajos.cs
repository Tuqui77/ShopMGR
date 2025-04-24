using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionTrabajos(IRepositorioConFoto repositorio, IMapper mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorioConFoto _repositorio = repositorio;
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

        public async Task AgregarFotosAsync(List<FotoDTO> fotos)
        {
            var Fotos = _mapper.Map<List<Foto>>(fotos);

            await _repositorio.AgregarFotosAsync(Fotos);
        }

        public async Task AgregarHorasAsync(HorasYDescripcionDTO horas)
        {
            var horasYDescripcion = _mapper.Map<HorasYDescripcion>(horas);
            await _repositorio.AgregarHorasAsync(horasYDescripcion);
        }

        public async Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            return await _repositorio.ObtenerPorIdAsync(id);
        }

        public async Task<Trabajo> ObtenerDetallePorIdAsync(int id)
        {
            return await _repositorio.ObtenerDetallePorIdAsync(id);
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
            var trabajoDb = await _repositorio.ObtenerPorIdAsync(id);

            if (trabajoDb.FechaInicio == null &&
                entidad.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDb.FechaInicio = DateTime.Now;
            }
            trabajoDb.IdCliente = entidad.IdCliente ?? trabajoDb.IdCliente;
            trabajoDb.Titulo = entidad.Titulo ?? trabajoDb.Titulo;
            trabajoDb.Estado = entidad.Estado ?? trabajoDb.Estado;
            trabajoDb.IdPresupuesto = entidad.IdPresupuesto ?? trabajoDb.IdPresupuesto;

            await _repositorio.ActualizarAsync(trabajoDb);
        }

        public async Task EliminarAsync(int idTrabajo)
        {
            await _repositorio.EliminarAsync(idTrabajo);
        }

    }
}
