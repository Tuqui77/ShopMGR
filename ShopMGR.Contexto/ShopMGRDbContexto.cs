using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using ShopMGR.Dominio.Modelo;


namespace ShopMGR.Contexto
{
    public partial class ShopMGRDbContexto(DbContextOptions<ShopMGRDbContexto> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ShopMGRDbContexto).Assembly);

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
                .OnDelete(DeleteBehavior.Cascade); //Revisar las cascadas de eliminación, hay datos que es mejor dejarlos.

            modelBuilder.Entity<TelefonoCliente>()
                .HasOne(t => t.Cliente)
                .WithMany(c => c.Telefono)
                .HasForeignKey("IdCliente");

            modelBuilder.Entity<Material>()
                .HasOne(m => m.Presupuesto)
                .WithMany(p => p.Materiales)
                .HasForeignKey("IdPresupuesto");

            modelBuilder.Entity<ConfiguracionGlobal>()
                .HasKey(c => c.Id);
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
