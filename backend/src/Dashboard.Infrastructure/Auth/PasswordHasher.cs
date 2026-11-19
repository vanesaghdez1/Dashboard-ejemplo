using Dashboard.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using IAppPasswordHasher = Dashboard.Application.Features.Auth.IPasswordHasher;

namespace Dashboard.Infrastructure.Auth;

/// <summary>
/// Usa el hasher de ASP.NET Core Identity (PBKDF2 + salt aleatorio + muchas iteraciones):
/// aunque dos usuarios tengan la misma contraseña, sus hashes son distintos.
/// </summary>
public class PasswordHasher : IAppPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password) => _hasher.HashPassword(user, password);

    public bool Verify(User user, string password) =>
        !string.IsNullOrEmpty(user.PasswordHash) &&
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
}
