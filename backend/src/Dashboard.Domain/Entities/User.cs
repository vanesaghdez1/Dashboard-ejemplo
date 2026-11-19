using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Usuario que inicia sesión en el sistema.</summary>
public class User : BaseEntity
{
    public required string Email { get; set; }
    public required string FullName { get; set; }

    /// <summary>Hash de la contraseña (PBKDF2). La contraseña en texto plano NUNCA se guarda.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Sucursal asignada (obligatoria para Gerente y Vendedor; vacía para Admin).</summary>
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
