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
    public class ClienteConfiguracion : IEntityTypeConfiguration<Cliente>
    {
        public void Configure(EntityTypeBuilder<Cliente> builder)
        {

            builder.Property(c => c.Id)
                .IsRequired(true);
            builder.HasIndex(c => c.Id)
                .IsUnique(true);

            builder.Property(c => c.NombreCompleto)
                .IsRequired(true)
                .HasMaxLength(100);

            builder.Property(c => c.Cuit)
                .IsRequired(false)
                .HasMaxLength(20);

            builder.Property(c => c.Balance)
                .IsRequired(false)
                .HasPrecision(18, 2);

            //Relaciones
            builder.HasMany(c => c.Direccion)
                .WithOne(d => d.Cliente)
                .HasForeignKey("IdCliente");

            builder.HasMany(c => c.Telefono)
                .WithOne(t => t.Cliente)
                .HasForeignKey("IdCliente");

            builder.HasMany(c => c.Trabajos)
                .WithOne(t => t.Cliente)
                .HasForeignKey("IdCliente");

            builder.HasMany(c => c.Presupuestos)
                .WithOne(p => p.Cliente)
                .HasForeignKey("IdCliente");
        }
    }
}
