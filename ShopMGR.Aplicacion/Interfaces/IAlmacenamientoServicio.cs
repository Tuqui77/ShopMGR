using Microsoft.AspNetCore.Http;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAlmacenamientoServicio
    {
        public Task<string> SubirFotoAsync(int idTrabajo, IFormFile foto);
        public Task EliminarFotoAsync(string rutaRelativaFoto);
    }
}
