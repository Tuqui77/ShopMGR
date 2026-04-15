using Microsoft.AspNetCore.Http;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAlmacenamientoServicio
    {
        public Task<string> SubirFotoAsync(int idTrabajo, IFormFile foto);
    }
}
