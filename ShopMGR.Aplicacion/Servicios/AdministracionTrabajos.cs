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
        MapperRegistry mapper
    ) : IAdministrarTrabajos
    {
        private readonly IRepositorioConFoto _repositorio = repositorio;
        private readonly IRepositorioConValorHora _repositorioPresupuestos = repositorioPresupuestos;
        private readonly IAdministrarClientes _clientes = clientes;
        private readonly IAlmacenamientoServicio _almacenamiento = almacenamiento;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Trabajo> CrearAsync(TrabajoDTO nuevoTrabajo)
        {
            var trabajo = _mapper.Map<TrabajoDTO, Trabajo>(nuevoTrabajo);

            if (nuevoTrabajo.Estado == EstadoTrabajo.Iniciado)
            {
                trabajo.IniciarTrabajo();
            }

            await _repositorio.CrearAsync(trabajo);
            return trabajo;
        }

        public async Task<Trabajo> CrearDesdePresupuestoAsync(int idPresupuesto)
        {
            var presupuesto =
                await _repositorioPresupuestos.ObtenerDetallePorIdAsync(idPresupuesto)
                ?? throw new KeyNotFoundException($"No hay un presupuesto con el ID {idPresupuesto}");

            var trabajoDTO = new TrabajoDTO
            {
                Titulo = presupuesto.Titulo,
                Descripcion = presupuesto.Descripcion ?? null,
                IdCliente = presupuesto.IdCliente,
                IdPresupuesto = presupuesto.Id,
                Estado = EstadoTrabajo.Pendiente,
                HorasEstimadas = presupuesto.HorasEstimadas,
                TotalLabor = presupuesto.CostoLabor,
            };

            return await CrearAsync(trabajoDTO);
        }

        public async Task<List<Trabajo>> ListarTodosAsync()
        {
            return await _repositorio.ListarTodosAsync();
        }

        public async Task AgregarFotosAsync(int idTrabajo, IFormFileCollection fotosNuevas)
        {
            var trabajo = await ObtenerPorIdAsync(idTrabajo);
            var fotos = new List<Foto>();

            foreach (var foto in fotosNuevas)
            {
                var rutaCompleta = await _almacenamiento.SubirFotoAsync(idTrabajo, foto);

                var fotoTmp = new Foto(idTrabajo, rutaCompleta);
                fotos.Add(fotoTmp);
            }

            trabajo.AgregarFotos(fotos);
            await _repositorio.ActualizarAsync(trabajo);
        }

        public async Task EliminarFotoAsync(int idTrabajo, int idImagen)
        {
            var trabajo = await _repositorio.ObtenerPorIdConFotoAsync(idTrabajo);
            var foto =
                trabajo.Fotos.FirstOrDefault(f => f.Id == idImagen)
                ?? throw new KeyNotFoundException("No existe una foto con ese id");
            var rutaRelativa = foto.RutaRelativa;

            trabajo.EliminarFoto(foto);
            await _repositorio.ActualizarAsync(trabajo);

            _ = Task.Run(() => _almacenamiento.EliminarFotoAsync(rutaRelativa));
        }

        public async Task AgregarHorasAsync(HorasYDescripcionDTO horasDTO)
        {
            if (horasDTO.Fecha == default)
                horasDTO.Fecha = DateOnly.FromDateTime(DateTime.Now);

            var horas = _mapper.Map<HorasYDescripcionDTO, HorasYDescripcion>(horasDTO);
            var trabajo = await _repositorio.ObtenerPorIdAsync(horasDTO.IdTrabajo);

            if (trabajo.IdPresupuesto == null)
            {
                var valorHora = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
                trabajo.AgregarHoras(horas, valorHora);
            }
            else
                trabajo.AgregarHoras(horas);

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
            trabajoDb.Editar(trabajoModificado.Titulo, trabajoModificado.Descripcion, trabajoModificado.IdCliente);

            if (trabajoDb.FechaInicio == null && trabajoModificado.Estado == EstadoTrabajo.Iniciado)
            {
                trabajoDb.IniciarTrabajo();
            }

            await _repositorio.ActualizarAsync(trabajoDb);
        }

        public async Task EliminarPresupuesto(int idTrabajo)
        {
            var trabajo = await _repositorio.ObtenerDetallePorIdAsync(idTrabajo);
            var costoHora = await _repositorioPresupuestos.ObtenerCostoHoraDeTrabajo();
            trabajo.EliminarPresupuesto(costoHora);
            await _repositorio.ActualizarAsync(trabajo);
        }

        public async Task CambiarPresupuesto(int idTrabajo, int idPresupuesto)
        {
            var trabajo = await _repositorio.ObtenerDetallePorIdAsync(idTrabajo);
            var presupuesto = await _repositorioPresupuestos.ObtenerPorIdAsync(idPresupuesto);
            trabajo.CambiarPresupuesto(presupuesto.Id, presupuesto.CostoLabor, presupuesto.HorasEstimadas);
            await _repositorio.ActualizarAsync(trabajo);
        }

        public async Task TerminarTrabajo(int idTrabajo)
        {
            var trabajo = await _repositorio.ObtenerDetallePorIdAsync(idTrabajo);
            trabajo.TerminarTrabajo();

            await _repositorio.ActualizarAsync(trabajo);

            var movimiento = new MovimientoBalanceDTO
            {
                Tipo = TipoMovimiento.Cargo,
                Monto = trabajo.TotalLabor.Value,
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
