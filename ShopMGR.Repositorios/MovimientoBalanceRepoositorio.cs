using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios;

public class MovimientoBalanceRepoositorio(ShopMGRDbContexto contexto) :IMovimientoBalanceRepositorio
{
	private readonly ShopMGRDbContexto _contexto = contexto;

	public async Task AgregarAsync(MovimientoBalance movimientoBalance)
	{
		await _contexto.MovimientoBalance.AddAsync(movimientoBalance);
		await _contexto.SaveChangesAsync();
	}

	public async Task<List<MovimientoBalance>> ObtenerPorClienteAsync(int idCliente)
	{
		var movimientos = await _contexto.MovimientoBalance
			.Where(m => m.IdCliente == idCliente)
			.ToListAsync();

		return movimientos;
	}

	public Task<List<MovimientoBalance>> ObtenerPorClienteYPeriodoAsync(int idCliente, DateOnly desde, DateOnly hasta)
	{
		var movimientos = _contexto.MovimientoBalance
			.Where(m => m.IdCliente == idCliente &&
			            m.Fecha > desde &&
			            m.Fecha < hasta)
			.ToListAsync();

		return movimientos;
	}

	public Task<List<MovimientoBalance>> ObtenerPorTrabajoAsync(int idTrabajo)
	{
		var movimientosTrabajo = _contexto.MovimientoBalance
			.Where(m => m.IdTrabajo == idTrabajo)
			.ToListAsync();
		
		return movimientosTrabajo;
	}
}