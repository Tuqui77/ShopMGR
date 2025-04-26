using Microsoft.AspNetCore.Http;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, ex.Message);
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = ex.Message });
            await context.Response.WriteAsync(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, ex.Message);
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = ex.Message });
            await context.Response.WriteAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado.");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = ex.Message });
            await context.Response.WriteAsync(response);
        }
    }
}