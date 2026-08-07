using System.Reflection;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using ShopMGR.Aplicacion;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests;

/// <summary>
/// Tests del servicio <see cref="RefreshTokenCleanupService"/> (issue #116 OPS-001).
///
/// ESTRATEGIA: SQLite in-memory (el proveedor InMemory de EF Core no soporta
/// <c>ExecuteDeleteAsync</c>). Se mantiene UNA conexión abierta durante todo el test
/// ("Data Source=:memory:" + conexión viva). El DbContext acepta
/// <c>DbContextOptions&lt;ShopMGRDbContexto&gt;</c>, así que se puede construir con
/// <c>UseSqlite</c> sin tocar producción. El esquema se crea con DDL SQLite mínimo
/// (ver <c>SqliteTestDb.CrearEsquemaMinimo</c>): <c>EnsureCreated()</c> falla porque el
/// modelo completo usa <c>nvarchar(max)</c> (PasskeyChallenge), incompatible con SQLite.
///
/// OPCIONES A/B (ver consigna): se usa la OPCIÓN A para los dos tests de comportamiento —
/// instanciar el service real con un <c>IServiceScopeFactory</c> mockeado que resuelve un
/// contexto SQLite y ejecutar <c>ExecuteAsync</c> cancelando tras verificar el resultado.
/// La sincronización NO usa sleep fijo: se hace polling de la BD (y del logger) hasta que
/// la limpieza produce el estado esperado; la cancelación posterior del <c>Task.Delay</c> de
/// 24h cierra el loop. El test de contrato de la condición (<c>&lt;=</c> vs <c>&gt;</c>)
/// usa la OPCIÓN B: replica la query exacta del service de forma determinística.
///
/// CONTRATO: se eliminan los tokens con <c>ExpiraEn &lt;= DateTime.Now</c> y se conservan
/// los no expirados. La condición <c>&gt;</c> (bug previo) elimina exactamente lo contrario.
/// </summary>
public class RefreshTokenCleanupServiceTests
{
    [Fact]
    public async Task Limpiar_CuandoHayTokensExpirados_DeberiaEliminarSoloLosExpirados()
    {
        // Arrange
        using var db = SqliteTestDb.Crear();
        await InsertarUsuarioConTokensAsync(
            db,
            [
                ("hash-expirado-1", Expirado: true, Revocado: false),
                ("hash-expirado-2", Expirado: true, Revocado: false),
                ("hash-valido-1", Expirado: false, Revocado: false),
                ("hash-valido-2", Expirado: false, Revocado: false),
                ("hash-revocado-no-expirado", Expirado: false, Revocado: true),
            ]
        );

        var (servicio, _) = CrearServicio(db.ContextoParaServicio);
        using var cts = new CancellationTokenSource();
        var tarea = servicio.Ejecutar(cts.Token);

        // Act: el servicio ejecuta su loop real; esperamos a que purgue los 2 expirados
        try
        {
            await EsperarHastaAsync(
                () => db.Contexto.RefreshTokens.Count() == 3,
                TimeSpan.FromSeconds(5),
                "el servicio debía eliminar los 2 tokens expirados"
            );
        }
        finally
        {
            cts.Cancel();
            try
            {
                await tarea;
            }
            catch (OperationCanceledException)
            {
                // cierre normal del loop por cancelación del Task.Delay de 24h
            }
        }

        // Assert
        var restantes = await db.Contexto
            .RefreshTokens.AsNoTracking()
            .Select(t => t.Hash)
            .ToListAsync();
        restantes
            .Should()
            .BeEquivalentTo("hash-valido-1", "hash-valido-2", "hash-revocado-no-expirado");
    }

    [Fact]
    public async Task Limpiar_CuandoNoHayTokensExpirados_DeberiaNoEliminarNada()
    {
        // Arrange
        using var db = SqliteTestDb.Crear();
        await InsertarUsuarioConTokensAsync(
            db,
            [
                ("hash-valido-1", Expirado: false, Revocado: false),
                ("hash-valido-2", Expirado: false, Revocado: false),
                ("hash-valido-3", Expirado: false, Revocado: false),
            ]
        );

        var (servicio, logger) = CrearServicio(db.ContextoParaServicio);
        using var cts = new CancellationTokenSource();
        var tarea = servicio.Ejecutar(cts.Token);

        // Act: esperamos a que el service ejecute su iteración (logger "Inicio de limpieza")
        // y que el conteo se mantenga estable en 3 durante varias lecturas consecutivas.
        int lecturasIguales = 0;
        int ultimoConteo = -1;
        try
        {
            await EsperarHastaAsync(
                () =>
                {
                    if (logger.Invocations.Count == 0)
                    {
                        lecturasIguales = 0;
                        return false;
                    }

                    var conteo = db.Contexto.RefreshTokens.Count();
                    if (conteo == ultimoConteo)
                        lecturasIguales++;
                    else
                    {
                        ultimoConteo = conteo;
                        lecturasIguales = 1;
                    }

                    return conteo == 3 && lecturasIguales >= 3;
                },
                TimeSpan.FromSeconds(5),
                "el servicio debía ejecutar la limpieza sin eliminar nada"
            );
        }
        finally
        {
            cts.Cancel();
            try
            {
                await tarea;
            }
            catch (OperationCanceledException)
            {
                // cierre normal del loop por cancelación del Task.Delay de 24h
            }
        }

        // Assert
        var restantes = await db.Contexto
            .RefreshTokens.AsNoTracking()
            .Select(t => t.Hash)
            .ToListAsync();
        restantes.Should().HaveCount(3);
        restantes.Should().BeEquivalentTo("hash-valido-1", "hash-valido-2", "hash-valido-3");
    }

    /// <summary>
    /// Test de CONTRATO (Opción B): replica exactamente la query del service con la condición
    /// INCORRECTA (<c>&gt;</c>) que existía antes de la corrección del issue #116.
    /// Demuestra que <c>&gt;</c> elimina los tokens NO expirados y conserva los expirados,
    /// es decir, la semántica invertida — por eso el contrato correcto es <c>&lt;=</c>.
    /// </summary>
    [Fact]
    public async Task Limpiar_CuandoSeUsaCondicionMayorQue_DeberiaEliminarLosNoExpirados()
    {
        // Arrange
        using var db = SqliteTestDb.Crear();
        await InsertarUsuarioConTokensAsync(
            db,
            [
                ("hash-expirado", Expirado: true, Revocado: false),
                ("hash-valido", Expirado: false, Revocado: false),
            ]
        );

        // Act: query contractual del bug previo (> en lugar de <=)
        var eliminados = await db.Contexto
            .RefreshTokens.Where(rt => rt.ExpiraEn > DateTime.Now)
            .ExecuteDeleteAsync();

        // Assert
        eliminados.Should().Be(1, "el bug > elimina el token NO expirado");
        var restante = await db.Contexto.RefreshTokens.AsNoTracking().SingleAsync();
        restante.Hash.Should().Be("hash-expirado", "el token expirado sobrevive con >");
    }

    // ─────────────────────── Helpers ───────────────────────

    /// <summary>
    /// Expone <c>ExecuteAsync</c> (protected) para poder ejecutar el loop real del service
    /// desde los tests sin tocar producción.
    /// </summary>
    private sealed class RefreshTokenCleanupServiceExposed(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupService> logger
    ) : RefreshTokenCleanupService(scopeFactory, logger)
    {
        public Task Ejecutar(CancellationToken ct) => ExecuteAsync(ct);
    }

    /// <summary>
    /// Contexto SQLite in-memory con UNA conexión abierta compartida por dos instancias de
    /// DbContext: una para el test y otra para el service. Se usan instancias separadas para
    /// evitar acceso concurrente al mismo DbContext (EF Core no es thread-safe) — el
    /// <c>ExecuteDeleteAsync</c> del service y el polling del test operan sobre la misma BD.
    /// </summary>
    private sealed class SqliteTestDb : IDisposable
    {
        private readonly SqliteConnection _conexion;

        public ShopMGRDbContexto Contexto { get; }

        public ShopMGRDbContexto ContextoParaServicio { get; }

        private SqliteTestDb(
            SqliteConnection conexion,
            ShopMGRDbContexto contexto,
            ShopMGRDbContexto contextoParaServicio
        )
        {
            _conexion = conexion;
            Contexto = contexto;
            ContextoParaServicio = contextoParaServicio;
        }

        public static SqliteTestDb Crear()
        {
            var conexion = new SqliteConnection("Data Source=:memory:");
            conexion.Open();

            var contexto = CrearContexto(conexion);
            var contextoParaServicio = CrearContexto(conexion);
            CrearEsquemaMinimo(contexto);

            return new SqliteTestDb(conexion, contexto, contextoParaServicio);
        }

        /// <summary>
        /// BLOQUEO DOCUMENTADO: <c>EnsureCreated()</c> sobre el modelo completo falla en SQLite
        /// porque <c>PasskeyChallengeConfiguracion</c> usa <c>.HasColumnType("nvarchar(max)")</c>
        /// (sintaxis SQL Server que SQLite no parsea: "near max: syntax error"). No se modifica
        /// producción, así que el test crea el esquema mínimo que necesita (Usuarios +
        /// RefreshTokens) con DDL SQLite que replica fielmente la configuración EF del modelo
        /// (columnas, PK, FK con ON DELETE CASCADE e índices únicos de Hash/Id).
        /// </summary>
        private static void CrearEsquemaMinimo(ShopMGRDbContexto contexto)
        {
            contexto.Database.ExecuteSqlRaw(
                """
                CREATE TABLE "Usuarios" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_Usuarios" PRIMARY KEY AUTOINCREMENT,
                    "UserName" TEXT NOT NULL,
                    "PasswordHash" TEXT NOT NULL,
                    "Rol" TEXT NOT NULL DEFAULT 'Empleado',
                    "CodigoUsoUnico" TEXT NULL,
                    "ExpiracionCodigoUsoUnico" TEXT NULL
                );

                CREATE TABLE "RefreshTokens" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_RefreshTokens" PRIMARY KEY AUTOINCREMENT,
                    "Hash" TEXT NOT NULL,
                    "CreadoEn" TEXT NOT NULL,
                    "ExpiraEn" TEXT NOT NULL,
                    "RevocadoEn" TEXT NULL,
                    "IdUsuario" INTEGER NOT NULL,
                    CONSTRAINT "FK_RefreshTokens_Usuarios_IdUsuario" FOREIGN KEY ("IdUsuario") REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
                );

                CREATE UNIQUE INDEX "IX_RefreshTokens_Hash" ON "RefreshTokens" ("Hash");
                CREATE UNIQUE INDEX "IX_RefreshTokens_Id" ON "RefreshTokens" ("Id");
                CREATE INDEX "IX_RefreshTokens_IdUsuario" ON "RefreshTokens" ("IdUsuario");
                CREATE UNIQUE INDEX "IX_Usuarios_Id" ON "Usuarios" ("Id");
                """
            );
        }

        private static ShopMGRDbContexto CrearContexto(SqliteConnection conexion)
        {
            var options = new DbContextOptionsBuilder<ShopMGRDbContexto>()
                .UseSqlite(conexion)
                .Options;
            return new ShopMGRDbContexto(options);
        }

        public void Dispose()
        {
            Contexto.Dispose();
            ContextoParaServicio.Dispose();
            _conexion.Dispose();
        }
    }

    private static (RefreshTokenCleanupServiceExposed Servicio, Mock<ILogger<RefreshTokenCleanupService>> Logger) CrearServicio(
        ShopMGRDbContexto contexto
    )
    {
        var services = new ServiceCollection();
        services.AddSingleton(contexto);
        var serviceProvider = services.BuildServiceProvider();

        var scope = new Mock<IServiceScope>();
        scope.Setup(s => s.ServiceProvider).Returns(serviceProvider);

        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);

        var logger = new Mock<ILogger<RefreshTokenCleanupService>>();

        return (new RefreshTokenCleanupServiceExposed(scopeFactory.Object, logger.Object), logger);
    }

    private static async Task<Usuario> InsertarUsuarioConTokensAsync(
        SqliteTestDb db,
        IEnumerable<(string Hash, bool Expirado, bool Revocado)> tokens
    )
    {
        var usuario = new Usuario { Id = 1, UserName = "admin", PasswordHash = "hash" };

        foreach (var (hash, expirado, revocado) in tokens)
        {
            var token = usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
            if (expirado)
                SetFechas(
                    token,
                    creadoEn: DateTime.Now.AddDays(-31),
                    expiraEn: DateTime.Now.AddHours(-1)
                );
            if (revocado)
                token.Revocar();
        }

        db.Contexto.Usuarios.Add(usuario);
        await db.Contexto.SaveChangesAsync();
        return usuario;
    }

    private static async Task EsperarHastaAsync(
        Func<bool> condicion,
        TimeSpan timeout,
        string mensaje
    )
    {
        var inicio = DateTime.UtcNow;
        while (!condicion())
        {
            if (DateTime.UtcNow - inicio > timeout)
                throw new TimeoutException(mensaje);
            await Task.Delay(50);
        }
    }

    /// <summary>
    /// Setea por reflexión las fechas del token (setters privados) ANTES de SaveChanges,
    /// para simular tokens expirados/revocados en BD sin tocar producción.
    /// </summary>
    private static void SetFechas(
        RefreshToken token,
        DateTime? creadoEn = null,
        DateTime? expiraEn = null,
        DateTime? revocadoEn = null
    )
    {
        if (creadoEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.CreadoEn), creadoEn.Value);
        if (expiraEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.ExpiraEn), expiraEn.Value);
        if (revocadoEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.RevocadoEn), revocadoEn.Value);
    }

    private static void SetPrivado(RefreshToken token, string nombrePropiedad, object valor) =>
        typeof(RefreshToken)
            .GetProperty(nombrePropiedad, BindingFlags.Instance | BindingFlags.Public)!
            .SetValue(token, valor);
}
