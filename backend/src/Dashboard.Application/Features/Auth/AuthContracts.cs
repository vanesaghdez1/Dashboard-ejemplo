using Dashboard.Domain.Entities;

namespace Dashboard.Application.Features.Auth;

/// <summary>Contrato para encriptar y verificar contraseñas (implementado en Infrastructure).</summary>
public interface IPasswordHasher
{
    string Hash(User user, string password);
    bool Verify(User user, string password);
}

/// <summary>Contrato para emitir tokens (implementado en Infrastructure con JWT).</summary>
public interface ITokenService
{
    /// <summary>Crea el JWT firmado con los datos del usuario (id, rol, sucursal).</summary>
    AccessToken CreateAccessToken(User user);

    /// <summary>Genera un refresh token aleatorio (el valor "crudo" que va en la cookie).</summary>
    string CreateRefreshToken();

    /// <summary>Hash SHA-256 del refresh token (lo único que se guarda en BD).</summary>
    string HashRefreshToken(string refreshToken);

    TimeSpan RefreshTokenLifetime { get; }
}

public record AccessToken(string Token, DateTime ExpiresAt);

// ---------- DTOs que viajan al frontend ----------

public record LoginRequest(string Email, string Password);

public record UserDto(Guid Id, string Email, string FullName, string Role, Guid? BranchId, string? BranchName);

/// <summary>Respuesta de login/refresh. El refresh token NO va en el JSON: va en una cookie HttpOnly.</summary>
public record AuthResponse(string AccessToken, DateTime ExpiresAt, UserDto User);

/// <summary>Resultado interno: incluye el refresh token para que el endpoint lo ponga en la cookie.</summary>
public record AuthResult(AuthResponse Response, string RefreshToken, DateTime RefreshTokenExpiresAt);
