using Microsoft.AspNetCore.Http;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarTrabajos : IAdministrarEntidades<Trabajo, TrabajoDTO, ModificarTrabajo>
    {
        Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente);
        Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado);
        Task AgregarFotosAsync(int idTrabajo, IFormFileCollection fotos);
        Task AgregarHorasAsync(HorasYDescripcionDTO horas);
        public Task TerminarTrabajo(int idTrabajo);
    }
}
