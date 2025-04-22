using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoPresupuesto
    {
        Pendiente = 0,
        Aceptado = 1,
        Rechazado = 2,
    }
}
