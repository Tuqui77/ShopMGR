using Microsoft.AspNetCore.Http;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionTrabajos(
        IRepositorioConFoto repositorio,
        IRepositorioConValorHora repositorioPresupuestos,
        IGoogleDriveServicio drive,
        MapperRegistry mapper) : IAdministrarTrabajos
    {
        private readonly IRepositorioConFoto _repositorio = repositorio;
        private readonly IRepositorioConValorHora _repositorioPresupuestos = repositorioPresupuestos;
        private readonly IGoogleDriveServicio _drive = drive;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO nuevoTrabajo)
        {
            var trabajo = _mapper.Map<TrabajoDTO, Trabajo>(nuevoTrabajo);
            
            if (nuevoTrabajo.Estado == EstadoTrabajo.Iniciado)
            {
                trabajo.FechaInicio = DateOnly.FromDateTime(DateTime.Now);
            }

            if (nuevoTrabajo.IdPresupuesto != null)
            {
                var presupuesto = await _repositorioPresupuestos.ObtenerPorIdAsync(nuevoTrabajo.IdPresupuesto.Value);
                trabajo.TotalLabor = presupuesto.CostoLabor;
            }
            
            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }

        public async Task AgregarFotosAsync(int idTrabajo, IFormFileCollection fotosNuevas)
        {
            await _drive.ConectarConGoogleDrive();
            var fotos = new List<Foto>();

            foreach (var foto in fotosNuevas)
            {
                var enlace = await _drive.SubirArchivoAsync(foto);

                var fotoTmp = new Foto
                {
                    IdTrabajo = idTrabajo,
                    Enlace = enlace
                };
                fotos.Add(fotoTmp);
            }

            await _repositorio.AgregarFotosAsync(fotos);
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
            var trabajoDb = await _repositorio.ObtenerDetallePorIdAsync(id);

            if (trabajoDb.FechaInicio == null &&
                trabajoModificado.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDb.FechaInicio = DateOnly.FromDateTime(DateTime.Now);;
            }

            if (trabajoDb.Estado == EstadoTrabajo.Iniciado &&
                trabajoModificado.Estado == EstadoTrabajo.Terminado)
            {
                trabajoDb.FechaFin = DateOnly.FromDateTime(DateTime.Now);

                if (trabajoDb.TotalLabor == null)
                {
                    var costoHoraDeTrabajo = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
                    trabajoDb.TotalLabor = costoHoraDeTrabajo * (decimal)trabajoDb.TotalHoras;
                }
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
