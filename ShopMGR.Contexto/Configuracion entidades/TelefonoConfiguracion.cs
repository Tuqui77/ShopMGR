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
    public class TelefonoConfiguracion : IEntityTypeConfiguration<TelefonoCliente>
    {
        public void Configure(EntityTypeBuilder<TelefonoCliente> builder)
        {
            builder.Property(t => t.Id)
                .IsRequired(true);
            builder.HasIndex(t => t.Id)
                .IsUnique(true);

            builder.Property(t => t.Telefono)
                .IsRequired(true)
                .HasMaxLength(15);

            builder.Property(t => t.Descripcion)
                .IsRequired(false)
                .HasMaxLength(50);

            //Relaciones
            builder.HasOne(t => t.Cliente)
                .WithMany(c => c.Telefono)
                .HasForeignKey(t => t.IdCliente)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
