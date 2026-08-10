using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using ShopMGR.Contexto;
using ShopMGR.WebApi.Aplicacion;

namespace ShopMGR.Tests.Integration;

// Un factory por clase de test (IClassFixture) => una BD SQLite :memory: aislada por clase.
// La conexión se abre una sola vez y se comparte entre Migrate() (Program.Main) y las requests.
public class ShopMGRWebApplicationFactory : WebApplicationFactory<Program>
{
    private SqliteConnection _conexion = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // SQLite en memoria: la conexión debe estar abierta durante toda la vida del host,
        // de lo contrario cada DbContext vería una BD vacía distinta.
        _conexion = new SqliteConnection(Claves.ConexionSqlite);
        _conexion.Open();

        builder.UseSetting("ConnectionStrings:ShopMGRDbContexto", Claves.ConexionSqlite);
        builder.UseSetting("Jwt:Token", Claves.JwtToken);
        builder.UseSetting("Jwt:ExpirationMinutes", "60");
        builder.UseSetting("ADMIN_USERNAME", Claves.AdminUsername);
        builder.UseSetting("ADMIN_PASSWORD", Claves.AdminPassword);
        builder.UseSetting("Auth:RefreshTokenCookie.Secure", "false");

        builder.ConfigureServices(services =>
        {
            // Reemplazar UseSqlServer (Program.cs) por SQLite en la conexión compartida.
            // En .NET 9 AddDbContext registra DbContextOptions<T> + IDbContextOptionsConfiguration<T>;
            // hay que remover ambos para que no queden los dos providers registrados.
            services.RemoveAll<DbContextOptions<ShopMGRDbContexto>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ShopMGRDbContexto>>();

            services.AddDbContext<ShopMGRDbContexto>(options =>
                options
                    .UseSqlite(_conexion)
                    // El snapshot de migraciones se generó para SQL Server; bajo SQLite EF detecta
                    // diferencias (datetime2, nvarchar, etc.) y lanza PendingModelChangesWarning como error.
                    .ConfigureWarnings(w =>
                        w.Ignore(RelationalEventId.PendingModelChangesWarning)
                    )
                    // PasskeyChallenge.OpcionesJson se declara nvarchar(max) en producción;
                    // el customizer de test lo cambia a TEXT para poder crear el esquema SQLite.
                    .ReplaceService<IModelCustomizer, ShopMGRTestModelCustomizer>()
            );

            // Las migraciones contienen tipos SQL Server (nvarchar(max)) que SQLite no parsea,
            // por lo que Database.Migrate() (ejecutado en Program.Main) fallaría siempre.
            // Para el host de TEST se crea el esquema desde el modelo actual con EnsureCreated()
            // y se marca el historial de migraciones como completo: así Migrate() se vuelve no-op
            // y el Bootstrap (que solo siembra el admin) encuentra las tablas.
            using (var scope = services.BuildServiceProvider().CreateScope())
            {
                var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
                contexto.Database.EnsureCreated();

                var migraciones = contexto.Database.GetMigrations().ToList();
                contexto.Database.ExecuteSqlRaw(
                    "CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (MigrationId TEXT NOT NULL PRIMARY KEY, ProductVersion TEXT NOT NULL)"
                );
                foreach (var migracion in migraciones)
                {
                    contexto.Database.ExecuteSqlRaw(
                        "INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ({0}, {1})",
                        migracion,
                        "9.0.0"
                    );
                }
            }
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _conexion?.Dispose();
        }
        base.Dispose(disposing);
    }
}
