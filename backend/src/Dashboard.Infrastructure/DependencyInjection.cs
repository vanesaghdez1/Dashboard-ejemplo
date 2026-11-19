using Dashboard.Application.Common;
using Dashboard.Application.Features.Auth;
using Dashboard.Infrastructure.Auth;
using Dashboard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using IAppPasswordHasher = Dashboard.Application.Features.Auth.IPasswordHasher;

namespace Dashboard.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Conecta las implementaciones reales con los contratos de Application:
    /// IAppDbContext → AppDbContext (PostgreSQL), ITokenService → TokenService (JWT),
    /// IPasswordHasher → PasswordHasher (PBKDF2).
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:Default'.");

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<DataSeeder>();

        // Valida la configuración de JWT al arrancar: si falta la clave, la app no inicia (mejor que fallar en el login).
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => o.Key.Length >= 32, "Jwt:Key debe tener al menos 32 caracteres.")
            .ValidateOnStart();

        services.AddSingleton<ITokenService, TokenService>();
        services.AddSingleton<IAppPasswordHasher, PasswordHasher>();

        return services;
    }
}
