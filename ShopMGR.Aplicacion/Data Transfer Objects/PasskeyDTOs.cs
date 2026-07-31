using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    // Recibe el assertion que generó el navegador del cliente
    public class IniciarSesionPasskeyRequest
    {
        public string Id { get; set; } = "";
        public string RawId { get; set; } = "";
        public AuthAssertionResponseDTO RespuestaAssertion { get; set; } = null!;
    }

    public class AuthAssertionResponseDTO
    {
        public string Id { get; set; } = "";
        public string RawId { get; set; } = "";
        public byte[]? Firma { get; set; }
        public byte[]? DatosAutenticador { get; set; }
        public byte[]? UserHandle { get; set; }
        public byte[]? DatosClienteJson { get; set; }
    }

    // Recibe el attestation que generó el navegador del cliente
    public class RegistrarPasskeyRequest
    {
        public string Id { get; set; } = "";
        public string RawId { get; set; } = "";
        public string NombreDispositivo { get; set; } = "";
        public AuthAttestationResponseDTO RespuestaAttestation { get; set; } = null!;
    }

    public class AuthAttestationResponseDTO
    {
        public string Id { get; set; } = "";
        public string RawId { get; set; } = "";
        public byte[]? Attestation { get; set; }
        public byte[]? DatosClienteJson { get; set; }
    }
}
