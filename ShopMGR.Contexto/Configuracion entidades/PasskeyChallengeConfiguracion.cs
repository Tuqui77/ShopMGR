using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class PasskeyChallengeConfiguracion : IEntityTypeConfiguration<PasskeyChallenge>
{
    public void Configure(EntityTypeBuilder<PasskeyChallenge> builder)
    {
        builder
            .Property(pkc => pkc.Id)
            .IsRequired(true);
        builder
            .HasKey(pkc => pkc.Id);

        builder
            .Property(pkc => pkc.Tipo)
            .IsRequired(true)
            .HasMaxLength(512);

        builder
            .Property(pkc => pkc.ChallengeBase64)
            .IsRequired(true)
            .HasMaxLength(512);

        builder
            .Property(pkc => pkc.OpcionesJson)
            .IsRequired(true)
            .HasColumnType("nvarchar(max)");

        builder
            .Property(pkc => pkc.IdUsuario)
            .IsRequired(false);

        builder
            .Property(pkc => pkc.FechaExpiracion)
            .IsRequired(true);


        builder
            .HasIndex(pkc => new { pkc.ChallengeBase64, pkc.FechaExpiracion })
            .HasDatabaseName("PasskeyChallenges_ChallengeNoExpirado");

        builder
            .HasIndex(pkc => pkc.FechaExpiracion)
            .HasDatabaseName("PasskeyChallenges_FechaExpiracion");
    }
}
