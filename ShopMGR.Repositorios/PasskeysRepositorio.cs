using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class PasskeysRepositorio(ShopMGRDbContexto contexto) : IRepositorioPasskeys
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<List<Passkey>> ListarCredencialesPorIdUsuario(int idUsuario)
        {
            var credencialesUsuario = await _contexto.Passkeys.Where(pk => pk.IdUsuario == idUsuario).ToListAsync();

            return credencialesUsuario;
        }

        public async Task<Passkey?> ObtenerPasskeyPorIdCredencial(byte[] idCredencial)
        {
            var credencial = await _contexto
                .Passkeys.Where(pk => pk.IdCredencial == idCredencial)
                .FirstOrDefaultAsync();

            return credencial;
        }

        public async Task<List<byte[]>> ObtenerTodasLasCredenciales()
        {
            var credenciales = await _contexto.Passkeys.Select(pk => pk.IdCredencial).ToListAsync();

            return credenciales;
        }

        public async Task<List<byte[]>> ObtenerCredencialesExistentesPorIdUsuario(int idUsuario)
        {
            var credencialesExistentes = await _contexto
                .Passkeys.Where(pk => pk.IdUsuario == idUsuario)
                .Select(pk => pk.IdCredencial)
                .ToListAsync();

            return credencialesExistentes;
        }

        public async Task GuardarPasskey(Passkey passkey)
        {
            _contexto.Passkeys.Add(passkey);
            await _contexto.SaveChangesAsync();
        }

        public async Task<Passkey?> ObtenerPasskeyPorRawId(byte[] id)
        {
            var passkey = await _contexto
                .Passkeys.Include(pk => pk.Usuario)
                    .ThenInclude(u => u.RefreshTokens)
                .FirstOrDefaultAsync(pk => pk.IdCredencial == id);

            return passkey;
        }

        public async Task<PasskeyChallenge?> ObtenerChallengeAuth(string challengeB64)
        {
            var challenge = await _contexto
                .Challenges.Where(pkc =>
                    pkc.ChallengeBase64 == challengeB64 && pkc.Tipo == "auth" && pkc.FechaExpiracion > DateTime.Now
                )
                .FirstOrDefaultAsync();

            return challenge;
        }

        public async Task<PasskeyChallenge?> ObtenerChallengeRegistroPorIdUsuario(int idUsuario)
        {
            var challenge = await _contexto
                .Challenges.Where(pkc =>
                    pkc.IdUsuario == idUsuario && pkc.Tipo == "registro" && pkc.FechaExpiracion > DateTime.Now
                )
                .OrderByDescending(pkc => pkc.Id)
                .FirstOrDefaultAsync();

            return challenge;
        }

        public async Task EliminarChallengeUsado(PasskeyChallenge challenge)
        {
            _contexto.Challenges.Remove(challenge);
            await _contexto.SaveChangesAsync();
        }

        public async Task GuardarChallenge(PasskeyChallenge challenge)
        {
            _contexto.Challenges.Add(challenge);
            await _contexto.SaveChangesAsync();
        }

        public async Task<bool> LaCredencialEsUnicaAlUsuario(byte[] idCredencial)
        {
            return !await _contexto.Passkeys.AnyAsync(pk => pk.IdCredencial == idCredencial);
        }

        public async Task<bool> ElUserHandleEsDuenoDeLaCredencial(byte[] userHandle, byte[] idCredencial)
        {
            var passkey = await _contexto.Passkeys.Where(pk => pk.IdCredencial == idCredencial).FirstOrDefaultAsync();
            if (
                passkey == null
                || userHandle == null
                || passkey.UserHandle == null
                || !passkey.UserHandle.SequenceEqual(userHandle)
            )
            {
                return false;
            }

            return true;
        }

        public async Task ActualizarAsync(Passkey credencial)
        {
            _contexto.Passkeys.Update(credencial);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarPasskeyAsync(Passkey credencial)
        {
            _contexto.Passkeys.Remove(credencial);
            await _contexto.SaveChangesAsync();
        }

        public async Task ActualizarContador(Passkey passkey, uint contador)
        {
            passkey.ActualizarContador(contador);
            _contexto.Passkeys.Update(passkey);
            await _contexto.SaveChangesAsync();
        }
    }
}
