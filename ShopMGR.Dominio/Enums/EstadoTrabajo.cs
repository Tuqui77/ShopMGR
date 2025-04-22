using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoTrabajo
    {
        Pendiente = 0,
        Iniciado = 1,
        Terminado = 2,
    }
}
