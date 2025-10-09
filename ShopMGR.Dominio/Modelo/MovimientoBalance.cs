using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class MovimientoBalance
{
	public int Id {get; set;}
	public decimal Monto {get; set;}
	public string Descripcion {get; set;}
	public DateOnly Fecha {get; set;}
	public TipoMovimiento Tipo {get; set;}
	
	//Relaciones
	public Cliente Cliente {get; set;}
	public int IdCliente {get; set;}
	public Trabajo Trabajo {get; set;}
	public int IdTrabajo {get; set;}
}