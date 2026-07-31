using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios;

public class AdministracionPasskeys(
    ShopMGRDbContexto contexto,
    IRepositorioPasskeys repositorio,
    IConfiguration configuracion,
    IFido2 fido2
) : IAdministracionPasskeys
{
    private readonly IConfiguration _configuracion = configuracion;
    private readonly IRepositorioPasskeys _repositorio = repositorio;
    private readonly IFido2 _fido2 = fido2;
    private static readonly JsonSerializerOptions _opcionesJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public async Task<CredentialCreateOptions> ObtenerOpcionesRegistroAsync(Usuario usuario)
    {
        var credencialesExistentes = await _repositorio.ObtenerCredencialesExistentesPorIdUsuario(usuario.Id);

        var usuarioFido2 = new Fido2User
        {
            Id = Encoding.UTF8.GetBytes(usuario.Id.ToString()),
            Name = usuario.UserName,
            DisplayName = usuario.UserName,
        };

        var serverDomain = _configuracion["fido2:serverDomain"];

        var opciones = _fido2.RequestNewCredential(
            new RequestNewCredentialParams
            {
                User = usuarioFido2,
                ExcludeCredentials = credencialesExistentes
                    .Select(id => new PublicKeyCredentialDescriptor(id))
                    .ToList(),
                AuthenticatorSelection = AuthenticatorSelection.Default,
                AttestationPreference = AttestationConveyancePreference.None,
                PubKeyCredParams = new List<PubKeyCredParam>
                {
                    new(COSE.Algorithm.ES256, PublicKeyCredentialType.PublicKey),
                    new(COSE.Algorithm.RS256, PublicKeyCredentialType.PublicKey),
                },
            }
        );

        var json = JsonSerializer.Serialize(opciones, _opcionesJson);
        var passkeyChallenge = new PasskeyChallenge("registro", opciones.Challenge, json, usuario.Id);

        await _repositorio.GuardarChallenge(passkeyChallenge);
        return opciones;
    }

    public async Task<Passkey> CompletarRegistroAsync(
        Usuario usuario,
        AuthenticatorAttestationRawResponse attestationResponse,
        string nombreDispositivo
    )
    {
        var challengeRegistro =
            await _repositorio.ObtenerChallengeRegistroPorIdUsuario(usuario.Id)
            ?? throw new InvalidOperationException("No se encontró un challenge válido. Intentá nuevamente");

        var opcionesRegistro = JsonSerializer.Deserialize<CredentialCreateOptions>(
            challengeRegistro.OpcionesJson,
            _opcionesJson
        );

        var resultado = await _fido2.MakeNewCredentialAsync(
            new MakeNewCredentialParams
            {
                AttestationResponse = attestationResponse,
                OriginalOptions = opcionesRegistro!,
                IsCredentialIdUniqueToUserCallback = (parametrosCredencial, ct) =>
                    _repositorio.LaCredencialEsUnicaAlUsuario(parametrosCredencial.CredentialId),
            }
        );

        await _repositorio.EliminarChallengeUsado(challengeRegistro);

        var passkey = new Passkey(resultado.Id, resultado.PublicKey, nombreDispositivo, usuario.Id);

        await _repositorio.GuardarPasskey(passkey);
        return passkey;
    }

    public async Task<AssertionOptions> ObtenerOpcionesAuthAsync()
    {
        var listaCredenciales = await _repositorio.ObtenerTodasLasCredenciales();
        var credenciales = listaCredenciales.Select(id => new PublicKeyCredentialDescriptor(id)).ToList();

        var opciones = _fido2.GetAssertionOptions(
            new GetAssertionOptionsParams
            {
                AllowedCredentials = credenciales,
                UserVerification = UserVerificationRequirement.Required,
            }
        );

        var json = JsonSerializer.Serialize(opciones, _opcionesJson);
        var challenge = new PasskeyChallenge("auth", opciones.Challenge, json);

        await _repositorio.GuardarChallenge(challenge);

        return opciones;
    }

    public async Task<Usuario?> CompletarAuthAsync(
        AuthenticatorAssertionRawResponse assertionResponse
    )
    {
        var challengeB64 = ExtraerChallengeJson(assertionResponse.Response.ClientDataJson)
            ?? throw new InvalidOperationException("No se pudo extraer el challenge de la respuesta");

        var challengeAuth = await _repositorio.ObtenerChallengeAuth(challengeB64)
            ?? throw new InvalidOperationException("Challenge de auth no encontrado o expirado");

        var opcionesRequest = JsonSerializer.Deserialize<AssertionOptions>(
                challengeAuth.OpcionesJson, _opcionesJson)
            ?? throw new InvalidOperationException("Error al reconstruir las opciones del request");

        await _repositorio.EliminarChallengeUsado(challengeAuth);

        var passkey = await _repositorio.ObtenerPasskeyPorRawId(assertionResponse.RawId);
        if (passkey == null) return null;

        var resultado = await _fido2.MakeAssertionAsync(new MakeAssertionParams
                {
                AssertionResponse = assertionResponse,
                OriginalOptions = opcionesRequest,
                StoredPublicKey = passkey.ClavePublica,
                StoredSignatureCounter = passkey.ContadorLogin,
                IsUserHandleOwnerOfCredentialIdCallback = (args, ct2) => _repositorio.ElUserHandleEsDuenoDeLaCredencial(args.UserHandle, args.CredentialId)
                });

        await _repositorio.ActualizarContador(passkey, resultado.SignCount);

        return passkey.Usuario;
    }

    private string? ExtraerChallengeJson(byte[]? json)
    {
        if (json == null || json.Length == 0) return null;

        try
        {
            using var doc = JsonDocument.Parse(json);
            var challengeB64Url = doc.RootElement.GetProperty("challenge").GetString();
            if (challengeB64Url == null) return null;

            var challengeB64 = challengeB64Url.Replace("-", "+").Replace("_", "/");

            switch (challengeB64.Length % 4)
            {
                case 2: challengeB64 += "=="; break;
                case 3: challengeB64 += "="; break;
            }

            return challengeB64;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
