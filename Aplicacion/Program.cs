using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ShopMGR.Aplicacion;
using ShopMGR.Contexto;
using ShopMGR.Infraestructura;
using ShopMGR.Infraestructura.Drive;
using System;
using System.Reflection;

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
            builder.Services.InyectarServicios();
            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
            });
            builder.Services.Configure<GoogleDriveSettings>(
                builder.Configuration.GetSection("GoogleDrive"));

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                var API_NAME = Assembly.GetExecutingAssembly().GetName().Name;

                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = API_NAME,
                    Description = "API ShopMGR"

                });

                //c.OperationFilter<SwaggerFileUploadFilter>();

            });

            var app = builder.Build();

            //using (var scope = app.Services.CreateScope())
            //{
            //    var db = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            //    db.Database.Migrate(); // Aplica migraciones automáticamente
            //    DbSeeder.Seed(db);     // Carga los datos iniciales
            //}



            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(o =>
                {
                    o.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
                });
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();
            app.Run();
        }
    }
}
