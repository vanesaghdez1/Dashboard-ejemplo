using Dashboard.Application.Features.Branches;
using Dashboard.Application.Features.Dashboard;
using Dashboard.Application.Features.Products;
using Microsoft.Extensions.DependencyInjection;

namespace Dashboard.Application;

/// <summary>Registra los casos de uso en el contenedor de inyección de dependencias.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<DashboardService>();
        services.AddScoped<ProductService>();
        services.AddScoped<BranchService>();
        return services;
    }
}
