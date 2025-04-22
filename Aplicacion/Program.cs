using AspNetCore.Scalar;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using ShopMGR.Aplicacion;
using ShopMGR.Contexto;
using ShopMGR.Infraestructura;
using ShopMGR.Infraestructura.Drive;
using Swashbuckle.AspNetCore.Swagger;
using System;
using System.Reflection;
using System.Text.Json.Serialization;

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
            builder.Services.ConfigureHttpJsonOptions(options =>
            {
                options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });


            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                //app.UseSwaggerUI();

                app.MapOpenApi();
                app.MapScalarApiReference(options =>
                {
                    options.WithOpenApiRoutePattern("swagger/v1/swagger.json");
                    options.Theme = ScalarTheme.DeepSpace;
                    options.Title = "ShopMGR WebAPI";
                });
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();
            app.Run();
        }
    }
}
