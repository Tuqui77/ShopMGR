using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using Xunit;

namespace ShopMGR.Tests;

/// <summary>
/// Tests de MetricasRepositorio (issue #95): ObtenerIngresosAsync ya no suma el
/// TotalLabor de trabajos Terminado del mes sino los movimientos TipoMovimiento.Pago.
/// Decisión de dominio: NO se agrega Cobro al enum — TipoMovimiento queda
/// Pago=0, Cargo=1, Anticipo=2, Compra=3, Ajuste=4.
/// </summary>
public class MetricasRepositorioTests
{
    // Mes fijo de referencia para movimientos (constructor permite fecha explícita).
    private static readonly DateOnly MesReferencia = new(2026, 7, 15);

    // Trabajo/Presupuesto/HorasYDescripcion no exponen setters de fecha: sus fechas
    // quedan fijadas a DateTime.Now al construirse, así que el período "actual" se
    // consulta con Hoy y el "otro mes" con una fecha lejana (2000-01).
    private static DateOnly Hoy => DateOnly.FromDateTime(DateTime.Now);
    private static readonly DateOnly MesVacio = new(2000, 1, 15);

    private ShopMGRDbContexto CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ShopMGRDbContexto>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShopMGRDbContexto(options);
    }

    private static async Task<int> CrearClienteAsync(ShopMGRDbContexto contexto, string sufijo)
    {
        var cliente = new Cliente { NombreCompleto = $"Cliente métricas {sufijo}" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();
        return cliente.Id;
    }

    private static async Task<int> CrearTrabajoAsync(
        ShopMGRDbContexto contexto,
        int idCliente,
        string titulo,
        EstadoTrabajo estado,
        decimal? totalLabor = null
    )
    {
        var trabajo = new Trabajo(titulo, null, idCliente, estado, null, null, totalLabor);
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();
        return trabajo.Id;
    }

    // El constructor no setea FechaFin: solo TerminarTrabajo() lo hace. Sin FechaFin,
    // ObtenerTrabajosTerminadosAsync (filtra por FechaFin.HasValue) no contaría el trabajo.
    private static async Task<int> CrearTrabajoTerminadoAsync(
        ShopMGRDbContexto contexto,
        int idCliente,
        string titulo,
        decimal? totalLabor = null
    )
    {
        var trabajo = new Trabajo(titulo, null, idCliente, EstadoTrabajo.Pendiente, null, null, totalLabor);
        trabajo.TerminarTrabajo();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();
        return trabajo.Id;
    }

    private static async Task CrearMovimientoAsync(
        ShopMGRDbContexto contexto,
        TipoMovimiento tipo,
        decimal monto,
        string descripcion,
        DateOnly fecha,
        int idCliente
    )
    {
        await contexto.MovimientoBalance.AddAsync(
            new MovimientoBalance(tipo, monto, descripcion, fecha, idCliente)
        );
        await contexto.SaveChangesAsync();
    }

    #region ObtenerIngresosAsync

    [Fact]
    public async Task ObtenerIngresosAsync_ConVariosPagosEnElMes_DevuelveLaSumaDeLosMontos()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "pagos");

        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "Pago 1", new DateOnly(2026, 7, 1), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 250.50m, "Pago 2", new DateOnly(2026, 7, 10), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 49.99m, "Pago 3", new DateOnly(2026, 7, 31), idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(MesReferencia);

        resultado.Should().Be(400.49m);
    }

    [Fact]
    public async Task ObtenerIngresosAsync_SoloSumaPagos_ExcluyeLosDemasTiposDelMismoMes()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "tipos");

        // Cargo/Compra con monto positivo se persisten como negativos (normalización de signo
        // del dominio); el fix del issue #95 los excluye por Tipo, no por signo.
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "Pago", new DateOnly(2026, 7, 5), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Cargo, 50m, "Cargo", new DateOnly(2026, 7, 6), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Compra, 30m, "Compra", new DateOnly(2026, 7, 7), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Anticipo, 20m, "Anticipo", new DateOnly(2026, 7, 8), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Ajuste, 10m, "Ajuste", new DateOnly(2026, 7, 9), idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(MesReferencia);

        resultado.Should().Be(100m);
    }

    [Fact]
    public async Task ObtenerIngresosAsync_IgnoraMovimientosDeOtroMes()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "filtro mes");

        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "Julio", new DateOnly(2026, 7, 15), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 500m, "Agosto", new DateOnly(2026, 8, 1), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 300m, "Junio", new DateOnly(2026, 6, 30), idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(MesReferencia);

        resultado.Should().Be(100m);
    }

    [Fact]
    public async Task ObtenerIngresosAsync_IgnoraMovimientosDeOtroAnio()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "filtro año");

        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "2026", new DateOnly(2026, 7, 15), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 999m, "2025", new DateOnly(2025, 7, 15), idCliente);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 999m, "2027", new DateOnly(2027, 7, 15), idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(MesReferencia);

        resultado.Should().Be(100m);
    }

    [Fact]
    public async Task ObtenerIngresosAsync_MesSinMovimientos_DevuelveCero()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "mes vacío");

        // Solo movimientos de agosto 2026; la consulta apunta a un mes sin Pagos.
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "Agosto", new DateOnly(2026, 8, 1), idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(new DateOnly(2026, 7, 15));

        resultado.Should().Be(0m);
    }

    [Fact]
    public async Task ObtenerIngresosAsync_NoSumaTotalLaborDeTrabajosTerminados()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "regresión");

        // Regresión del issue #95: un trabajo Terminado con TotalLabor alto en el período
        // NO debe sumarse; antes de este issue ObtenerIngresosAsync devolvía TotalLabor.
        await CrearTrabajoTerminadoAsync(contexto, idCliente, "Trabajo terminado", 9999m);
        await CrearMovimientoAsync(contexto, TipoMovimiento.Pago, 100m, "Pago", Hoy, idCliente);

        var resultado = await repositorio.ObtenerIngresosAsync(Hoy);

        resultado.Should().Be(100m);
    }

    #endregion

    #region ObtenerHorasAsync

    [Fact]
    public async Task ObtenerHorasAsync_SumaHorasDelMesYAnio_IgnoraOtrosPeríodos()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "horas");
        var idTrabajo = await CrearTrabajoAsync(contexto, idCliente, "Trabajo horas", EstadoTrabajo.Iniciado);

        await contexto.HorasYDescripcion.AddRangeAsync(
            new HorasYDescripcion { Horas = 2.5f, Descripcion = "Hora 1", Fecha = Hoy, IdTrabajo = idTrabajo },
            new HorasYDescripcion { Horas = 1.5f, Descripcion = "Hora 2", Fecha = Hoy, IdTrabajo = idTrabajo },
            new HorasYDescripcion { Horas = 50f, Descripcion = "Hora vieja", Fecha = MesVacio, IdTrabajo = idTrabajo }
        );
        await contexto.SaveChangesAsync();

        var resultado = await repositorio.ObtenerHorasAsync(Hoy);

        resultado.Should().Be(4f);
    }

    #endregion

    #region ObtenerTrabajosTerminadosAsync

    [Fact]
    public async Task ObtenerTrabajosTerminadosAsync_CuentaSoloTrabajosTerminadosDelMes()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "terminados");

        // TerminarTrabajo() fija FechaFin = hoy: los dos Terminado caen en el mes actual.
        await CrearTrabajoTerminadoAsync(contexto, idCliente, "Terminado 1");
        await CrearTrabajoTerminadoAsync(contexto, idCliente, "Terminado 2");
        await CrearTrabajoAsync(contexto, idCliente, "Pendiente", EstadoTrabajo.Pendiente);
        await CrearTrabajoAsync(contexto, idCliente, "Iniciado", EstadoTrabajo.Iniciado);

        var resultado = await repositorio.ObtenerTrabajosTerminadosAsync(Hoy);

        resultado.Should().Be(2);
    }

    [Fact]
    public async Task ObtenerTrabajosTerminadosAsync_MesSinTrabajosTerminados_DevuelveCero()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "terminados vacío");
        await CrearTrabajoTerminadoAsync(contexto, idCliente, "Terminado");

        var resultado = await repositorio.ObtenerTrabajosTerminadosAsync(MesVacio);

        resultado.Should().Be(0);
    }

    #endregion

    #region ObtenerPresupuestosCreadosAsync

    [Fact]
    public async Task ObtenerPresupuestosCreadosAsync_CuentaPresupuestosDelMes()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "presupuestos");

        // Presupuesto fija Fecha = hoy al construirse: ambos caen en el mes actual.
        await contexto.Presupuestos.AddRangeAsync(
            new Presupuesto("Presupuesto 1", null, [], 4, idCliente),
            new Presupuesto("Presupuesto 2", null, [], 6, idCliente)
        );
        await contexto.SaveChangesAsync();

        var resultado = await repositorio.ObtenerPresupuestosCreadosAsync(Hoy);

        resultado.Should().Be(2);
    }

    [Fact]
    public async Task ObtenerPresupuestosCreadosAsync_MesSinPresupuestos_DevuelveCero()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "presupuestos vacío");
        await contexto.Presupuestos.AddAsync(new Presupuesto("Presupuesto", null, [], 4, idCliente));
        await contexto.SaveChangesAsync();

        var resultado = await repositorio.ObtenerPresupuestosCreadosAsync(MesVacio);

        resultado.Should().Be(0);
    }

    #endregion

    #region ObtenerPresupuestosAceptadosAsync

    [Fact]
    public async Task ObtenerPresupuestosAceptadosAsync_CuentaSoloAceptadosDelMes()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "aceptados");

        // AceptarPresupuesto() fija FechaAceptado = hoy; el rechazado queda sin FechaAceptado.
        var aceptado1 = new Presupuesto("Aceptado 1", null, [], 4, idCliente);
        var aceptado2 = new Presupuesto("Aceptado 2", null, [], 5, idCliente);
        var rechazado = new Presupuesto("Rechazado", null, [], 6, idCliente);
        aceptado1.AceptarPresupuesto();
        aceptado2.AceptarPresupuesto();
        rechazado.RechazarPresupuesto();
        await contexto.Presupuestos.AddRangeAsync(aceptado1, aceptado2, rechazado);
        await contexto.SaveChangesAsync();

        var resultado = await repositorio.ObtenerPresupuestosAceptadosAsync(Hoy);

        resultado.Should().Be(2);
    }

    [Fact]
    public async Task ObtenerPresupuestosAceptadosAsync_MesSinAceptados_DevuelveCero()
    {
        using var contexto = CreateDbContext();
        var repositorio = new MetricasRepositorio(contexto);
        var idCliente = await CrearClienteAsync(contexto, "aceptados vacío");
        var aceptado = new Presupuesto("Aceptado", null, [], 4, idCliente);
        aceptado.AceptarPresupuesto();
        await contexto.Presupuestos.AddAsync(aceptado);
        await contexto.SaveChangesAsync();

        var resultado = await repositorio.ObtenerPresupuestosAceptadosAsync(MesVacio);

        resultado.Should().Be(0);
    }

    #endregion
}
