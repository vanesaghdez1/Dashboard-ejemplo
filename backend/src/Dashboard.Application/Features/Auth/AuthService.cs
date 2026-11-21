using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Auth;

/// <summary>Caso de uso: iniciar sesión, renovar sesión y cerrar sesión.</summary>
public class AuthService(IAppDbContext db, IPasswordHasher passwordHasher, ITokenService tokenService)
{
    /// <summary>Devuelve null si el correo o la contraseña son incorrectos (sin decir cuál de los dos).</summary>
    public async Task<AuthResult?> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Branch).FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !user.IsActive || !passwordHasher.Verify(user, request.Password))
            return null;

        return await IssueTokensAsync(user, ct);
    }

    /// <summary>
    /// Cambia un refresh token válido por uno nuevo (rotación) y emite un access token nuevo.
    /// Si alguien intenta reutilizar un token ya usado, se asume robo y se cierran todas las sesiones del usuario.
    /// </summary>
    public async Task<AuthResult?> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var hash = tokenService.HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens
            .Include(t => t.User).ThenInclude(u => u.Branch)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null)
            return null;

        if (!stored.IsActive)
        {
            if (stored.RevokedAt is not null)
                await RevokeAllForUserAsync(stored.UserId, ct); // reutilización detectada
            return null;
        }

        if (!stored.User.IsActive)
            return null;

        stored.Revoke(); // un refresh token solo sirve una vez
        return await IssueTokensAsync(stored.User, ct);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var hash = tokenService.HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is null) return;

        stored.Revoke();
        await db.SaveChangesAsync(ct);
    }

    public async Task<UserDto?> GetUserAsync(Guid userId, CancellationToken ct) =>
        await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new UserDto(u.Id, u.Email, u.FullName, u.Role.ToString(), u.BranchId,
                u.Branch != null ? u.Branch.Name : null))
            .FirstOrDefaultAsync(ct);

    private async Task<AuthResult> IssueTokensAsync(User user, CancellationToken ct)
    {
        var accessToken = tokenService.CreateAccessToken(user);
        var refreshToken = tokenService.CreateRefreshToken();
        var refreshExpiresAt = DateTime.UtcNow.Add(tokenService.RefreshTokenLifetime);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokenService.HashRefreshToken(refreshToken),
            ExpiresAt = refreshExpiresAt,
        });
        await db.SaveChangesAsync(ct);

        var userDto = new UserDto(user.Id, user.Email, user.FullName, user.Role.ToString(), user.BranchId, user.Branch?.Name);
        return new AuthResult(new AuthResponse(accessToken.Token, accessToken.ExpiresAt, userDto), refreshToken, refreshExpiresAt);
    }

    private async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct)
    {
        var active = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(ct);
        active.ForEach(t => t.Revoke());
        await db.SaveChangesAsync(ct);
    }
}
