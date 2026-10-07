using Microsoft.Extensions.Diagnostics.HealthChecks;

public class LivenessHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext contexto,
        CancellationToken cancellationToken = default
    )
    {
        return Task.FromResult(HealthCheckResult.Healthy());
    }
}
