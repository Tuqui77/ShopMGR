using Microsoft.AspNetCore.Http;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarTrabajos : IAdministrarEntidades<Trabajo, TrabajoDTO, ModificarTrabajo>
    {
        Task<Trabajo> CrearDesdePresupuestoAsync(int idPresupuesto);
        Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente);
        Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado);
        Task<List<Trabajo>> ListarTodosAsync();
        Task AgregarFotosAsync(int idTrabajo, IFormFileCollection fotos);
        Task EliminarFotoAsync(int idTrabajo, int idImagen);
        Task AgregarHorasAsync(HorasYDescripcionDTO horas);
        Task IniciarTrabajo(int idTrabajo);
        Task TerminarTrabajo(int idTrabajo);
        Task EliminarPresupuesto(int idTrabajo);
        Task CambiarPresupuesto(int idTrabajo, int idPresupuesto);
    }
}
