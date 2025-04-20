using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Contexto.Configuracion_entidades
{
    public class MaterialConfiguracion :IEntityTypeConfiguration<Material>
    {
        public void Configure(EntityTypeBuilder<Material> builder)
        {
            builder.Property(m => m.Id)
                .IsRequired(true);
            builder.HasIndex(m => m.Id)
                .IsUnique(true);

            builder.Property(m => m.Descripcion)
                .IsRequired(true)
                .HasMaxLength(100);

            builder.Property(m => m.Precio)
                .IsRequired(true)
                .HasPrecision(18, 2);

            builder.Property(m => m.Cantidad)
                .IsRequired(true);

            //Relaciones
            builder.HasOne(m => m.Presupuesto)
                .WithMany(p => p.Materiales)
                .HasForeignKey(m => m.IdPresupuesto)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
