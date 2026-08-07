using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class RefreshTokenConfiguracion : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(rt => rt.Id)
            .IsRequired(true);
        builder.HasIndex(rt => rt.Id)
            .IsUnique(true);

        builder.Property(rt => rt.Hash)
            .IsRequired(true)
            .HasMaxLength(64);
        builder
            .HasIndex(rt => rt.Hash)
            .IsUnique(true);

        builder.Property(rt => rt.CreadoEn)
            .IsRequired(true)
            .HasColumnType("datetime2");

        builder.Property(rt => rt.ExpiraEn)
            .IsRequired(true)
            .HasColumnType("datetime2");

        builder.Property(rt => rt.RevocadoEn)
            .IsRequired(false)
            .HasColumnType("datetime2");

        builder
            .HasOne(rt => rt.Usuario)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.IdUsuario);
    }
}
