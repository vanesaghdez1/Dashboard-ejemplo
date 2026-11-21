using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Dashboard.Infrastructure.Auth;

namespace Dashboard.Api.Auth;

/// <summary>
/// Lee los datos del usuario desde el JWT ya validado (HttpContext.User).
/// Application solo ve la interfaz ICurrentUser; no sabe nada de HTTP.
/// </summary>
public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private System.Security.Claims.ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId => Guid.TryParse(Principal?.FindFirst(AppClaims.UserId)?.Value, out var id) ? id : null;

    public UserRole? Role => Enum.TryParse<UserRole>(Principal?.FindFirst(AppClaims.Role)?.Value, out var role) ? role : null;

    public Guid? BranchId => Guid.TryParse(Principal?.FindFirst(AppClaims.BranchId)?.Value, out var id) ? id : null;
}
