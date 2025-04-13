using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Util.Store;

namespace ShopMGR.Infraestructura.Drive
{
    public class GoogleDriveAuthenticator
    {
        public async Task<UserCredential> LoginAsync(string clientId, string clientSecret)
        {
            var secrets = new ClientSecrets()
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            };

            return await GoogleWebAuthorizationBroker.AuthorizeAsync(
                secrets,
                new[] { DriveService.Scope.Drive },
                "usuario",
                CancellationToken.None,
                new FileDataStore("TokenStorage"));

        }
    }
}
