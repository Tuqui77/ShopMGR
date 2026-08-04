using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class UsuarioConfiguracion : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.Property(u => u.Id).IsRequired(true);
        builder.HasIndex(u => u.Id).IsUnique(true);

        builder
            .Property(u => u.Rol)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(RolUsuario.Empleado);

        builder.Property(u => u.UserName).IsRequired(true).HasMaxLength(50);

        builder.Property(u => u.PasswordHash).IsRequired(true);

        builder.Property(u => u.CodigoUsoUnico).IsRequired(false);

        builder
            .HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.Usuario)
            .HasForeignKey(rt => rt.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .Navigation(u => u.RefreshTokens)
            .HasField("_refreshTokens")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder
            .HasMany(u => u.PassKeys)
            .WithOne(pk => pk.Usuario)
            .HasForeignKey(pk => pk.IdUsuario)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(u => u.PassKeys).HasField("_passKeys").UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
