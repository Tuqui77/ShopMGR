using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Contexto.Configuracion_entidades
{
    public class PresupuestoConfiguracion : IEntityTypeConfiguration<Presupuesto>
    {
        public void Configure(EntityTypeBuilder<Presupuesto> builder)
        {
            builder.Property(p => p.Id)
                .IsRequired(true);
            builder.HasIndex(p => p.Id)
                .IsUnique(true);

            builder.Property(p => p.Titulo)
                .IsRequired(true)
                .HasMaxLength(100);

            builder.Property(p => p.Descripcion)
                .IsRequired(false)
                .HasMaxLength(500);

            builder.Property(p => p.Fecha)
                .IsRequired(true)
                .HasColumnType("date");

            builder.Property(p => p.HorasEstimadas)
                .IsRequired(true);

            builder.Property(p => p.CostoMateriales)
                .IsRequired(true)
                .HasPrecision(18, 2);

            builder.Property(p => p.CostoLabor)
                .IsRequired(true)
                .HasPrecision(18, 2);

            builder.Property(p => p.CostoInsumos)
                .IsRequired(true)
                .HasPrecision(18, 2);

            builder.Property(p => p.Total)
                .IsRequired(true)
                .HasPrecision(18, 2);

            builder.Property(p => p.Estado)
                .IsRequired(true)
                .HasConversion<string>()
                .HasMaxLength(10);


            //Relaciones
            builder.HasOne(p => p.Cliente)
                .WithMany(c => c.Presupuestos)
                .HasForeignKey("IdCliente")
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
