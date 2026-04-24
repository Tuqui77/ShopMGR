using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConFoto : IRepositorioConEstado<Trabajo, EstadoTrabajo>
    {
        Task AgregarFotosAsync(List<Foto> fotos);
        Task AgregarHorasAsync(HorasYDescripcion horas);
        Task<List<Trabajo>> ListarTodosAsync();
        Task<Trabajo> ObtenerPorIdConFotoAsync(int id);
        //    Task<List<Foto>> ObtenerFotosAsync(int idTrabajo);
        //    Task EliminarFotoAsync(int idTrabajo, int idFoto);
    }
}
