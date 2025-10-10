using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Contexto.Configuracion_entidades;

public class MovimientoBalanceConfiguracion :IEntityTypeConfiguration<MovimientoBalance>
{
	public void Configure(EntityTypeBuilder<MovimientoBalance> builder)
	{
		builder.Property(m => m.Id)
			.IsRequired(true);
		builder.HasIndex(m => m.Id)
			.IsUnique(true);

		builder.Property(m => m.Monto)
			.IsRequired(true)
			.HasPrecision(18, 2);

		builder.Property(m => m.Descripcion)
			.IsRequired(true)
			.HasMaxLength(50);
		
		builder.Property(m => m.Fecha)
			.IsRequired(true)
			.HasColumnType("date");
		
		//Relaciones
		builder.HasOne(m => m.Cliente)
			.WithMany(c => c.MovimientosBalance)
			.HasForeignKey(m => m.IdCliente);

		builder.HasOne(m => m.Trabajo)
			.WithMany()
			.HasForeignKey(m => m.IdTrabajo)
			.OnDelete(DeleteBehavior.NoAction)
			.IsRequired(false);
	}
}