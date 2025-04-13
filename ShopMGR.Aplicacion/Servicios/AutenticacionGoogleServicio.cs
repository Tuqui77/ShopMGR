using Microsoft.Extensions.Options;
using ShopMGR.Infraestructura.Drive;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AutenticacionGoogleServicio
    {
        private readonly GoogleDriveAuthenticator _authenticator;
        private readonly GoogleDriveSettings _settings;

        public AutenticacionGoogleServicio(GoogleDriveAuthenticator authenticator, IOptions<GoogleDriveSettings> options)
        {
            _authenticator = authenticator;
            _settings = options.Value;
        }

        public async Task ConectarConGoogleDrive()
        {
            await _authenticator.LoginAsync(_settings.ClientId, _settings.ClientSecret);
        }
    }
}
