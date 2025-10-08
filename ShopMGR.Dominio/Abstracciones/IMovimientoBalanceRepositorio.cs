using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Dominio.Abstracciones;

public interface IMovimientoBalanceRepositorio
{
	public Task AgregarAsync(MovimientoBalance movimientoBalance);
	public Task<List<MovimientoBalance>> ObtenerPorClienteAsync(int idCliente);
	public Task<List<MovimientoBalance>> ObtenerPorClienteYPeriodoAsync(int idCliente, DateOnly desde, DateOnly hasta);
	public Task<List<MovimientoBalance>> ObtenerPorTrabajoAsync(int idTrabajo);
	
}