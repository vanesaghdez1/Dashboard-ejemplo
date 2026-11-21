namespace Dashboard.Infrastructure.Auth;

/// <summary>Configuración de JWT, leída de la sección "Jwt" de appsettings / variables de entorno.</summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>Quién emite el token (esta API).</summary>
    public string Issuer { get; set; } = "Dashboard.Api";

    /// <summary>Para quién es el token (el frontend).</summary>
    public string Audience { get; set; } = "Dashboard.Web";

    /// <summary>Clave secreta para firmar (HMAC-SHA256). Mínimo 32 caracteres. En producción: variable de entorno.</summary>
    public string Key { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
