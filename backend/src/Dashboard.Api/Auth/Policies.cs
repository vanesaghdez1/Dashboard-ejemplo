using Dashboard.Domain.Entities;

namespace Dashboard.Api.Auth;

/// <summary>Políticas de autorización: reglas con nombre de "quién puede entrar a qué".</summary>
public static class Policies
{
    /// <summary>Cifras financieras del dashboard: solo Admin y Gerente.</summary>
    public const string CanViewDashboard = nameof(CanViewDashboard);

    /// <summary>Crear, editar y eliminar productos: solo Admin.</summary>
    public const string CanManageProducts = nameof(CanManageProducts);

    public static void Configure(Microsoft.AspNetCore.Authorization.AuthorizationOptions options)
    {
        options.AddPolicy(CanViewDashboard, p => p.RequireRole(nameof(UserRole.Admin), nameof(UserRole.Manager)));
        options.AddPolicy(CanManageProducts, p => p.RequireRole(nameof(UserRole.Admin)));
    }
}
