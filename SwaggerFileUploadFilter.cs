using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System;

namespace ShopMGR.Infraestructura
{
    public class SwaggerFileUploadFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var fileParams = context.MethodInfo
                .GetParameters()
                .Where(p =>
                    p.ParameterType.GetProperties().Any(prop =>
                        prop.PropertyType == typeof(IFormFile) ||
                        prop.PropertyType == typeof(List<IFormFile>) ||
                        prop.PropertyType == typeof(IFormFile[])));

            if (fileParams.Any())
            {
                operation.RequestBody = new OpenApiRequestBody
                {
                    Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = fileParams.First().ParameterType.GetProperties().ToDictionary(
                                prop => prop.Name,
                                prop =>
                                {
                                    if (prop.PropertyType == typeof(List<IFormFile>) || prop.PropertyType == typeof(IFormFile[]))
                                    {
                                        return new OpenApiSchema
                                        {
                                            Type = "array",
                                            Items = new OpenApiSchema
                                            {
                                                Type = "string",
                                                Format = "binary"
                                            }
                                        };
                                    }

                                    return new OpenApiSchema
                                    {
                                        Type = "string",
                                        Format = "binary"
                                    };
                                })
                        }
                    }
                }
                };
            }
        }
    }

}