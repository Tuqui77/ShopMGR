using Microsoft.EntityFrameworkCore;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Contexto
{
    public partial class ShopMGRDbContexto
    {
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Trabajo> Trabajos { get; set; }
        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<Material> Materiales { get; set; }
        public DbSet<Direccion> Direccion { get; set; }
        public DbSet<TelefonoCliente> TelefonoCliente { get; set; }
        public DbSet<Foto> Fotos { get; set; }

        //Persistencia de configuraciones de la aplicación.
        public DbSet<ConfiguracionGlobal> Configuraciones { get; set; }
    }
}
