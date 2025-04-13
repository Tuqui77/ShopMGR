using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IGoogleDriveServicio
    {
        public Task<UserCredential> ConectarConGoogleDrive();
        public Task SubirArchivoAsync(IFormFile archivos);
    }
}
