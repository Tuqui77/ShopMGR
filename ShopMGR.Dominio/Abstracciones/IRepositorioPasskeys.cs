using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioPasskeys
    {
        public Task<List<Passkey>> ListarCredencialesPorIdUsuario(int idUsuario);
        public Task<Passkey?> ObtenerPasskeyPorIdCredencial(byte[] idCredencial);
        public Task GuardarPasskey(Passkey passkey);
        public Task<Passkey?> ObtenerPasskeyPorRawId(byte[] id);
        public Task<List<byte[]>> ObtenerTodasLasCredenciales();
        public Task<List<byte[]>> ObtenerCredencialesExistentesPorIdUsuario(int idUsuario);
        public Task<PasskeyChallenge?> ObtenerChallengeAuth(string challengeB64);
        public Task GuardarChallenge(PasskeyChallenge challenge);
        public Task<PasskeyChallenge?> ObtenerChallengeRegistroPorIdUsuario(int idUsuario);
        public Task<bool> LaCredencialEsUnicaAlUsuario(byte[] idCredencial);
        public Task<bool> ElUserHandleEsDuenoDeLaCredencial(byte[] userHandle, byte[] idCredencial);
        public Task EliminarChallengeUsado(PasskeyChallenge challenge);
        public Task ActualizarAsync(Passkey credencial);
        public Task EliminarPasskeyAsync(Passkey credencial);
        public Task ActualizarContador(Passkey passkey, uint contador);
    }
}
