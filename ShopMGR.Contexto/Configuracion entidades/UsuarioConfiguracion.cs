using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class UsuarioConfiguracion : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.Property(u => u.Id)
            .IsRequired(true);
        builder.HasIndex(u => u.Id)
            .IsUnique(true);

        builder.Property(u => u.UserName)
            .IsRequired(true)
            .HasMaxLength(50);

        builder.Property(u => u.PasswordHash)
            .IsRequired(true);
    }
}