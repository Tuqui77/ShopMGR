using Microsoft.EntityFrameworkCore;
using ShopMGR.Dominio.Modelo;


namespace ShopMGR.Contexto
{
    public class ShopMGRDbContexto : DbContext
    {
        public ShopMGRDbContexto(DbContextOptions<ShopMGRDbContexto> options) : base(options)
        {
        }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Trabajo> Trabajos { get; set; }
        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<Direccion> Direccion { get; set; }
        public DbSet<TelefonoCliente> TelefonoCliente { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Cliente>();
            modelBuilder.Entity<Direccion>()
                .HasOne(d => d.Cliente)
                .WithMany(c => c.Direccion)
                .HasForeignKey("IdCliente");
            modelBuilder.Entity<Trabajo>();
            modelBuilder.Entity<Presupuesto>();
            modelBuilder.Entity<TelefonoCliente>()
                .HasOne(t => t.Cliente)
                .WithMany(c => c.Telefono)
                .HasForeignKey("IdCliente");
        }
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        public override int SaveChanges()
        {
            return base.SaveChanges();
        }
    }
}
