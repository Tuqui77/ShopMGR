using Fido2NetLib;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces;

public interface IAdministracionPasskeys
{
    public Task<CredentialCreateOptions> ObtenerOpcionesRegistroAsync(Usuario usuario);
    public Task<Passkey> CompletarRegistroAsync(
        Usuario usuario,
        AuthenticatorAttestationRawResponse attestationResponse,
        string nombreDispositivo
    );
    public Task<AssertionOptions> ObtenerOpcionesAuthAsync();
    public Task<Usuario?> CompletarAuthAsync(
            AuthenticatorAssertionRawResponse assertionResponse
    );
}
