using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class PasskeyConfiguracion : IEntityTypeConfiguration<Passkey>
{
    public void Configure(EntityTypeBuilder<Passkey> builder)
    {
        builder
            .Property(pk => pk.IdCredencial)
            .IsRequired(true)
            .HasMaxLength(1024);
        builder
            .HasKey(pk => pk.IdCredencial);

        builder
            .Property(pk => pk.ClavePublica)
            .IsRequired(true)
            .HasMaxLength(512);
        
        builder
            .Property(pk => pk.UserHandle)
            .IsRequired(true)
            .HasMaxLength(512);

        builder
            .Property(pk => pk.ContadorLogin)
            .HasConversion<long>()
            .IsRequired(true);

        builder.
            Property(pk => pk.Nombre)
            .IsRequired(true)
            .HasMaxLength(20);

        builder
            .Property(pk => pk.FechaCreacion)
            .IsRequired(true)
            .HasColumnType("date");

        builder
            .Property(pk => pk.UltimoUso)
            .IsRequired(false)
            .HasColumnType("date");

        builder
            .Property(pk => pk.Attestation)
            .IsRequired(false)
            .HasMaxLength(512);
    }
}
