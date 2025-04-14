using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.Crmf;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Infraestructura.Drive;

namespace ShopMGR.Aplicacion.Servicios
{
    public class GoogleDriveServicio : IGoogleDriveServicio
    {
        private readonly GoogleDriveClient _client;
        private readonly GoogleDriveSettings _settings;

        public GoogleDriveServicio(GoogleDriveClient client, IOptions<GoogleDriveSettings> options)
        {
            _client = client;
            _settings = options.Value;
        }

        public async Task<UserCredential> ConectarConGoogleDrive()
        {
            var credentials = await _client.LoginAsync(_settings.ClientId, _settings.ClientSecret);

            return credentials;
        }

        public async Task<string> SubirArchivoAsync(IFormFile archivos)
        {
            await _client.LoginAsync(_settings.ClientId, _settings.ClientSecret);

            using var stream = archivos.OpenReadStream();

            var link = await _client.SubirArchivoAsync(stream, archivos.FileName, archivos.ContentType);

            return link;
        }
    }
}
