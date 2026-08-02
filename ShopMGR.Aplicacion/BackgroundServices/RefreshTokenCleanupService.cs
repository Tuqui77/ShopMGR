using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ShopMGR.Contexto;

namespace ShopMGR.Aplicacion
{
    public class RefreshTokenCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupService> logger
    ) : BackgroundService
    {
        // Va a eliminar todos los tokens que estén expirados. En caso de necesitar auditorías se pueden conservar un tiempo
        // más cambiando la regla tanto acá como en la entidad Usuario.
        private readonly ILogger<RefreshTokenCleanupService> _logger = logger;
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

        protected override async Task ExecuteAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                var scope = _scopeFactory.CreateScope();
                var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();

                try
                {
                    _logger.LogInformation("Inicio de limpieza de RefreshTokens");

                    var cantidadEliminados = await contexto
                        .RefreshTokens.Where(rt => rt.ExpiraEn <= DateTime.Now)
                        .ExecuteDeleteAsync();

                    if (cantidadEliminados > 0)
                        _logger.LogInformation("Se eliminaron {cantidadEliminados} RefreshTokens expirados", cantidadEliminados);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error limpiando refresh tokens");
                }

                await Task.Delay(TimeSpan.FromHours(24), ct);
            }
        }
    }
}
