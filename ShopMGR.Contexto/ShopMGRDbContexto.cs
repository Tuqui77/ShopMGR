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
