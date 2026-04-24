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
        IAdministrarClientes clientes,
        IAlmacenamientoServicio almacenamiento,
        IGoogleDriveServicio drive,
        MapperRegistry mapper
    ) : IAdministrarTrabajos
    {
        private readonly IRepositorioConFoto _repositorio = repositorio;
        private readonly IRepositorioConValorHora _repositorioPresupuestos = repositorioPresupuestos;
        private readonly IAdministrarClientes _clientes = clientes;
        private readonly IAlmacenamientoServicio _almacenamiento = almacenamiento;
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

        public async Task<List<Trabajo>> ListarTodosAsync()
        {
            return await _repositorio.ListarTodosAsync();
        }

        public async Task AgregarFotosAsync(int idTrabajo, IFormFileCollection fotosNuevas)
        {
            var fotos = new List<Foto>();

            foreach (var foto in fotosNuevas)
            {
                var rutaCompleta = await _almacenamiento.SubirFotoAsync(idTrabajo, foto);

                var fotoTmp = new Foto(idTrabajo, rutaCompleta);
                fotos.Add(fotoTmp);
            }

            await _repositorio.AgregarFotosAsync(fotos);
        }

        public async Task EliminarFotoAsync(int idTrabajo, int idImagen)
        {
            var trabajoConFoto = await _repositorio.ObtenerPorIdConFotoAsync(idTrabajo);
            var foto = trabajoConFoto.Fotos.FirstOrDefault(f => f.Id == idImagen)
                ?? throw new KeyNotFoundException("No existe una foto con ese id");
            var rutaRelativa = foto.RutaCompleta;

            trabajoConFoto.Fotos.Remove(foto);
            await _repositorio.ActualizarAsync(trabajoConFoto);

            _ = Task.Run(() => _almacenamiento.EliminarFotoAsync(rutaRelativa));
        }

        public async Task AgregarHorasAsync(HorasYDescripcionDTO horasDTO)
        {
            horasDTO.Fecha = horasDTO.Fecha == default ? DateOnly.FromDateTime(DateTime.Now) : horasDTO.Fecha;

            var horas = _mapper.Map<HorasYDescripcionDTO, HorasYDescripcion>(horasDTO);

            var trabajo = await _repositorio.ObtenerPorIdAsync(horasDTO.IdTrabajo);
            trabajo.HorasDeTrabajo.Add(horas);

            if (trabajo.IdPresupuesto == null)
            {
                var valorHora = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
                trabajo.TotalLabor = valorHora * (decimal)trabajo.TotalHoras;
            }
            await _repositorio.ActualizarAsync(trabajo);
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

            if (trabajoDb.FechaInicio == null && trabajoModificado.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDb.FechaInicio = DateOnly.FromDateTime(DateTime.Now);
            }

            trabajoDb.IdCliente = trabajoModificado.IdCliente;
            trabajoDb.Titulo = trabajoModificado.Titulo;
            trabajoDb.Estado = trabajoModificado.Estado;

            var presupuestoAnterior = trabajoDb.IdPresupuesto;
            var presupuestoNuevo = trabajoModificado.IdPresupuesto;
            var cambioPresupuesto = presupuestoAnterior != presupuestoNuevo;

            if (cambioPresupuesto)
            {
                if (presupuestoNuevo == null) //Se eliminó el presupuesto
                {
                    var costoHora = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
                    trabajoDb.TotalLabor = costoHora * (decimal)trabajoDb.HorasDeTrabajo.Sum(h => h.Horas);
                }
                else //Se agregó o cambió el presupuesto
                {
                    var presupuesto = await _repositorioPresupuestos.ObtenerPorIdAsync(
                        (int)trabajoModificado.IdPresupuesto!
                    );
                    trabajoDb.TotalLabor = presupuesto.CostoLabor;
                }
            }
            trabajoDb.IdPresupuesto = trabajoModificado.IdPresupuesto;

            await _repositorio.ActualizarAsync(trabajoDb);
        }

        public async Task TerminarTrabajo(int idTrabajo)
        {
            var trabajo = await _repositorio.ObtenerDetallePorIdAsync(idTrabajo);

            // Calcular total si no existe
            if (!trabajo.TotalLabor.HasValue)
            {
                var costoHora = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
                trabajo.TotalLabor = (decimal)(trabajo.HorasDeTrabajo.Sum(h => h.Horas) * (float)costoHora);
            }

            trabajo.FechaFin = DateOnly.FromDateTime(DateTime.Now);
            trabajo.Estado = EstadoTrabajo.Terminado;

            await _repositorio.ActualizarAsync(trabajo);

            var movimiento = new MovimientoBalanceDTO
            {
                Tipo = TipoMovimiento.Cargo,
                Monto = -trabajo.TotalLabor.Value,
                Descripcion = $"Trabajo #{idTrabajo} - {trabajo.Titulo}",
                Fecha = DateOnly.FromDateTime(DateTime.Now),
                IdCliente = trabajo.IdCliente,
                IdTrabajo = trabajo.Id,
            };

            await _clientes.RegistrarMovimientoAsync(movimiento);
        }

        public async Task EliminarAsync(int idTrabajo)
        {
            await _repositorio.EliminarAsync(idTrabajo);
        }
    }
}
