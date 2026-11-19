using Dashboard.Domain.Entities;

namespace Dashboard.Api.Auth;

/// <summary>Políticas de autorización: reglas con nombre de "quién puede entrar a qué".</summary>
public static class Policies
{
    /// <summary>Cifras financieras del dashboard: solo Admin y Gerente.</summary>
    public const string CanViewDashboard = nameof(CanViewDashboard);

    public static void Configure(Microsoft.AspNetCore.Authorization.AuthorizationOptions options)
    {
        options.AddPolicy(CanViewDashboard, p => p.RequireRole(nameof(UserRole.Admin), nameof(UserRole.Manager)));
    }
}
