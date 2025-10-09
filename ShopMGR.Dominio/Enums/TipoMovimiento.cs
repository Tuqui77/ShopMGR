using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoMovimiento
{
	Pago = 0,
	Cargo = 1,
	Anticipo = 2,
	Compra = 3,
	Ajuste = 4,
}