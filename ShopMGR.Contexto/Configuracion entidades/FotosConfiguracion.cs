using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class FotosConfiguracion :IEntityTypeConfiguration<Foto>
{
	public void Configure(EntityTypeBuilder<Foto> builder)
	{
		builder.Property(f => f.Id)
			.IsRequired(true);
		builder.HasIndex(f => f.Id)
			.IsUnique(true);
		
		builder.Property(f => f.Enlace)
			.IsRequired(true)
			.HasMaxLength(100);

		builder.HasOne(f => f.Trabajo)
			.WithMany(t => t.Fotos)
			.HasForeignKey(f => f.IdTrabajo);
	}
}