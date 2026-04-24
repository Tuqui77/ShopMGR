using Microsoft.AspNetCore.Http;
using ShopMGR.Aplicacion.Interfaces;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AlmacenamientoServicio() : IAlmacenamientoServicio
    {
        public async Task<string> SubirFotoAsync(int idTrabajo, IFormFile foto)
        {
            var dirId = idTrabajo.ToString();
            var carpeta = Path.Combine(Directory.GetCurrentDirectory(), "imagenes", dirId);

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var nombreArchivo = Guid.NewGuid().ToString() + Path.GetExtension(foto.FileName);
            var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await foto.CopyToAsync(stream);
            }

            return Path.Combine(dirId, nombreArchivo);
        }


        public Task EliminarFotoAsync(string rutaRelativaFoto)
        {
            var ruta = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "imagenes",
                    rutaRelativaFoto
                    );

            if(File.Exists(ruta))
            {
                File.Delete(ruta);
            }

            return Task.CompletedTask;
        }
    }
}
