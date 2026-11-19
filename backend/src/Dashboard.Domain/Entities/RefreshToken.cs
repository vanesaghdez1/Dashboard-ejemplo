using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>
/// "Boleto" para renovar el access token sin volver a pedir contraseña.
/// Se guarda solo su hash: si alguien roba la base de datos, no puede usar los tokens.
/// </summary>
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public required string TokenHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;

    public void Revoke() => RevokedAt ??= DateTime.UtcNow;
}
