using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;

namespace ShopMGR.Infraestructura.Drive
{
    public class GoogleDriveClient(DriveService driveService)
    {
        private DriveService _driveService = driveService;

        public async Task<UserCredential> LoginAsync(string clientId, string clientSecret)
        {
            var secrets = new ClientSecrets()
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            };

            var credentials = await GoogleWebAuthorizationBroker.AuthorizeAsync(
                secrets,
                new[] { DriveService.Scope.Drive },
                "usuario",
                CancellationToken.None,
                new FileDataStore("TokenStorage"));

            if (credentials == null)
            {
                throw new InvalidOperationException("No se pudo autenticar con Google Drive.");
            }

            _driveService = new DriveService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credentials,
                ApplicationName = "ShopMGR",
            });

            return credentials;
        }

        public async Task<string> SubirArchivoAsync(Stream archivoStream, string nombreArchivo, string mimeType)
        {
            if (_driveService == null)
            {
                throw new InvalidOperationException("El servicio de Google Drive no está inicializado.");
            }

            var fileMetadata = new Google.Apis.Drive.v3.Data.File()
            {
                Name = nombreArchivo,
            };

            var request = _driveService.Files.Create(fileMetadata, archivoStream, mimeType);
            request.Fields = "id"; //Solo prueba, en realidad necesito que devuelva el enlace del archivo.

            var result = await request.UploadAsync();

            if (result.Status == Google.Apis.Upload.UploadStatus.Completed)
            {
                return request.ResponseBody.Id;
            }
            else
            {
                throw new Exception($"Error al subir el archivo: {result.Exception.Message}");
            }


        }



    }
}
