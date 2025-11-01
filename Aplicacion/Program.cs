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
using System.Configuration;
using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Middleware;

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
                options.JsonSerializerOptions.ReferenceHandler =
                    System.Text.Json.Serialization.ReferenceHandler.Preserve;
            });
            builder.Services.Configure<GoogleDriveSettings>(
                builder.Configuration.GetSection("GoogleDrive"));

            //servicios del contenedor
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

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opciones =>
                {
                    opciones.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidateAudience = true,
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Token"]!)),
                    };
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

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.MapControllers();
            app.Run();
        }
    }
}