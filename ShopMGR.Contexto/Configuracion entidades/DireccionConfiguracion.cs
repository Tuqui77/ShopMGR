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
    public class DireccionConfiguracion : IEntityTypeConfiguration<Direccion>
    {
        public void Configure(EntityTypeBuilder<Direccion> builder)
        {
            builder.Property(d => d.Id)
                .IsRequired(true);
            builder.HasIndex(d => d.Id)
                .IsUnique(true);

            builder.Property(d => d.Calle)
                .IsRequired(true)
                .HasMaxLength(40);

            builder.Property(d => d.Altura)
                .IsRequired(true)
                .HasMaxLength(10);

            builder.Property(d => d.Piso)
                .IsRequired(false)
                .HasMaxLength(2);

            builder.Property(d => d.Departamento)
                .IsRequired(false)
                .HasMaxLength(5);

            builder.Property(d => d.Descripcion)
                .IsRequired(false)
                .HasMaxLength(100);

            builder.Property(d => d.CodigoPostal)
                .IsRequired(false)
                .HasMaxLength(10);

            builder.Property(d => d.MapsID)
                .IsRequired(false)
                .HasMaxLength(100);

            //Relaciones
            builder.HasOne(d => d.Cliente)
                .WithMany(c => c.Direccion)
                .HasForeignKey("IdCliente");
        }
    }
}
