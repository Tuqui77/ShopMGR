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
    public class TrabajoConfiguracion : IEntityTypeConfiguration<Trabajo>
    {
        public void Configure(EntityTypeBuilder<Trabajo> builder)
        {
            builder.Property(t => t.Id)
                .IsRequired(true);
            builder.HasIndex(t => t.Id)
                .IsUnique(true);

            builder.Property(t => t.Titulo)
                .IsRequired(true)
                .HasMaxLength(100);

            builder.Property(t => t.Estado)
                .IsRequired(true)
                .HasConversion<string>()
                .HasMaxLength(10);

            builder.Property(t => t.FechaInicio)
                .IsRequired(false)
                .HasColumnType("date");
            
            builder.Property(t => t.FechaFin)
                .IsRequired(false)
                .HasColumnType("date");

            //Relaciones
            builder.HasOne(t => t.Cliente)
                 .WithMany(c => c.Trabajos)
                 .HasForeignKey("IdCliente");

            builder.HasOne(t => t.Presupuesto)
                .WithOne(p => p.Trabajo)
                .HasForeignKey<Trabajo>("IdPresupuesto");
        }
    }
}
