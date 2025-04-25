using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ShopMGR.Contexto;

public class ShopMGRDbContextoFactory : IDesignTimeDbContextFactory<ShopMGRDbContexto>
{
    public ShopMGRDbContexto CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ShopMGRDbContexto>();
        optionsBuilder.UseSqlServer(WebApplication.CreateBuilder(args).Configuration.GetConnectionString("ShopMGRDbContexto"));
        
        return new ShopMGRDbContexto(optionsBuilder.Options);
    }
}