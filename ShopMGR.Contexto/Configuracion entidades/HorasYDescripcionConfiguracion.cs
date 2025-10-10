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
    public class HorasYDescripcionConfiguracion : IEntityTypeConfiguration<HorasYDescripcion>
    {
        public void Configure(EntityTypeBuilder<HorasYDescripcion> builder)
        {
            builder.Property(h => h.Id)
                .IsRequired(true);
            builder.HasIndex(h => h.Id)
                .IsUnique(true);

            builder.Property(h => h.Horas)
                .IsRequired(true);

            builder.Property(h => h.Descripcion)
                .IsRequired(true)
                .HasMaxLength(500);

            builder.Property(h => h.Fecha)
                .IsRequired(true)
                .HasColumnType("date");

            //Relaciones
            builder.HasOne(h => h.Trabajo)
                .WithMany(t => t.HorasDeTrabajo)
                .HasForeignKey(h => h.IdTrabajo)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
