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
    public class ConfiguracionGlobalConfiguracion :IEntityTypeConfiguration<ConfiguracionGlobal>
    {
        public void Configure(EntityTypeBuilder<ConfiguracionGlobal> builder)
        {
            builder.Property(c => c.Id)
                .IsRequired(true);
            builder.HasIndex(c => c.Id)
                .IsUnique(true);

            builder.Property(c => c.Clave)
                .IsRequired(true)
                .HasMaxLength(100);

            builder.Property(c => c.Valor)
                .IsRequired(true)
                .HasMaxLength(200);
        }
    }
}
