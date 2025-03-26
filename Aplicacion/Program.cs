using Microsoft.EntityFrameworkCore;
using ShopMGR.Aplicacion;
using ShopMGR.Contexto;
using ShopMGR.WebApi.Infraestructura;

namespace ShopMGR.WebApi.Aplicacion
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);



            //inyeccion de dependencias

            builder.Services.AddDbContext<ShopMGRDbContexto>(options =>
            {
                options.UseSqlServer(builder.Configuration.GetConnectionString("ShopMGRDbContexto"));
            });
            builder.Services.InyectarServicioss();



            // Add services to the container.
            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();



            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();
            app.Run();
        }
    }
}
