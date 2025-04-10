using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConFoto : IRepositorioConEstado<Trabajo, EstadoTrabajo>
    {
        Task<List<Foto>> AgregarFotosAsync(int idTrabajo, List<Foto> fotos);
        //    Task<List<Foto>> ObtenerFotosAsync(int idTrabajo);
        //    Task EliminarFotoAsync(int idTrabajo, int idFoto);
    }
}
