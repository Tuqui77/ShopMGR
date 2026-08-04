using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RolUsuario
{
    Administrador = 0,
    Empleado = 1,
    Cliente = 2,
}
