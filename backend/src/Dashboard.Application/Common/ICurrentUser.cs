using Dashboard.Domain.Entities;

namespace Dashboard.Application.Common;

/// <summary>
/// Quién está haciendo la petición actual. Se llena a partir del JWT
/// (la implementación vive en Api, porque necesita HttpContext).
/// </summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    UserRole? Role { get; }
    Guid? BranchId { get; }
}
