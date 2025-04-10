using Microsoft.EntityFrameworkCore;
using ShopMGR.Dominio.Modelo;


namespace ShopMGR.Contexto
{
    public class ShopMGRDbContexto(DbContextOptions<ShopMGRDbContexto> options) : DbContext(options)
    {
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Trabajo> Trabajos { get; set; }
        public DbSet<Presupuesto> Presupuestos { get; set; }
        public DbSet<Material> Materiales { get; set; }
        public DbSet<Direccion> Direccion { get; set; }
        public DbSet<TelefonoCliente> TelefonoCliente { get; set; }
        public DbSet<Foto> Fotos { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Cliente>()
                .HasMany(c => c.Direccion)
                .WithOne(d => d.Cliente)
                .HasForeignKey("IdCliente");
            modelBuilder.Entity<Cliente>()
                .HasMany(c => c.Telefono)
                .WithOne(t => t.Cliente)
                .HasForeignKey("IdCliente")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Direccion>()
                .HasOne(d => d.Cliente)
                .WithMany(c => c.Direccion)
                .HasForeignKey("IdCliente")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Trabajo>()
                .HasOne(t => t.Cliente)
                .WithMany(c => c.Trabajos)
                .HasForeignKey("IdCliente");
            modelBuilder.Entity<Trabajo>()
                .HasOne(t => t.Presupuesto)
                .WithOne(p => p.Trabajo)
                .HasForeignKey<Trabajo>("IdPresupuesto");
            modelBuilder.Entity<Trabajo>()
                .HasMany(t => t.Fotos)
                .WithOne(f => f.Trabajo)
                .HasForeignKey("IdTrabajo");
            //Falta la relación con HorasDeTrabajo

            modelBuilder.Entity<Presupuesto>()
                .HasOne(p => p.Cliente)
                .WithMany(c => c.Presupuestos)
                .HasForeignKey("IdCliente")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TelefonoCliente>()
                .HasOne(t => t.Cliente)
                .WithMany(c => c.Telefono)
                .HasForeignKey("IdCliente");

            modelBuilder.Entity<Material>()
                .HasOne(m => m.Presupuesto)
                .WithMany(p => p.Materiales)
                .HasForeignKey("IdPresupuesto");
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
