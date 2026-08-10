using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.Integration;

// El modelo de producción declara PasskeyChallenge.OpcionesJson como nvarchar(max),
// tipo exclusivo de SQL Server que SQLite no puede parsear. Este customizer se usa
// SOLO en el host de test para generar un esquema SQLite válido; no toca producción.
public class ShopMGRTestModelCustomizer(ModelCustomizerDependencies dependencies)
    : ModelCustomizer(dependencies)
{
    public override void Customize(ModelBuilder modelBuilder, DbContext context)
    {
        base.Customize(modelBuilder, context);

        modelBuilder
            .Entity<PasskeyChallenge>()
            .Property(pkc => pkc.OpcionesJson)
            .HasColumnType("TEXT");
    }
}
