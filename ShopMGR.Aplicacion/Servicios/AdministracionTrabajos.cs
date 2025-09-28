using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionTrabajos(IRepositorioConFoto repositorio, 
        MapperRegistry mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorioConFoto _repositorio = repositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO nuevoTrabajo)
        {
            var trabajo = _mapper.Map<TrabajoDTO, Trabajo>(nuevoTrabajo);
            
            if (nuevoTrabajo.Estado == EstadoTrabajo.Iniciado)
            {
                trabajo.FechaInicio = DateTime.Now;
            }

            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }

        public async Task AgregarFotosAsync(List<FotoDTO> nuevasFotos)
        {
            var fotos = _mapper.Map<FotoDTO, Foto>(nuevasFotos); 

            await _repositorio.AgregarFotosAsync(fotos.ToList()); // TODO: Generalizar los métodos del repositorio para que reciban IEnumerable y así evitar conversiones innecesarias
        }

        public async Task AgregarHorasAsync(HorasYDescripcionDTO horas)
        {
            var horasYDescripcion = _mapper.Map<HorasYDescripcionDTO, HorasYDescripcion>(horas);
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

        public async Task ActualizarAsync(int id, ModificarTrabajo trabajoModificado)
        {
            var trabajoDb = await _repositorio.ObtenerPorIdAsync(id);

            if (trabajoDb.FechaInicio == null &&
                trabajoModificado.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDb.FechaInicio = DateTime.Now;
            }
            trabajoDb.IdCliente = trabajoModificado.IdCliente ?? trabajoDb.IdCliente;
            trabajoDb.Titulo = trabajoModificado.Titulo ?? trabajoDb.Titulo;
            trabajoDb.Estado = trabajoModificado.Estado ?? trabajoDb.Estado;
            trabajoDb.IdPresupuesto = trabajoModificado.IdPresupuesto ?? trabajoDb.IdPresupuesto;

            await _repositorio.ActualizarAsync(trabajoDb);
        }

        public async Task EliminarAsync(int idTrabajo)
        {
            await _repositorio.EliminarAsync(idTrabajo);
        }

    }
}
