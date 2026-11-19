using System.Security.Cryptography;
using System.Text;
using Dashboard.Application.Features.Auth;
using Dashboard.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Dashboard.Infrastructure.Auth;

/// <summary>Nombres de los "claims" (datos) que viajan dentro del JWT.</summary>
public static class AppClaims
{
    public const string UserId = JwtRegisteredClaimNames.Sub;
    public const string Email = JwtRegisteredClaimNames.Email;
    public const string Name = "name";
    public const string Role = "role";
    public const string BranchId = "branch_id";
}

public class TokenService(IOptions<JwtOptions> options) : ITokenService
{
    private readonly JwtOptions _options = options.Value;

    public TimeSpan RefreshTokenLifetime => TimeSpan.FromDays(_options.RefreshTokenDays);

    public AccessToken CreateAccessToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);

        var claims = new Dictionary<string, object>
        {
            [AppClaims.UserId] = user.Id.ToString(),
            [AppClaims.Email] = user.Email,
            [AppClaims.Name] = user.FullName,
            [AppClaims.Role] = user.Role.ToString(),
        };
        if (user.BranchId is { } branchId)
            claims[AppClaims.BranchId] = branchId.ToString();

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            Expires = expiresAt,
            Claims = claims,
            // La firma garantiza que nadie pueda alterar el token (p. ej. cambiarse el rol a Admin).
            SigningCredentials = new SigningCredentials(CreateSigningKey(_options.Key), SecurityAlgorithms.HmacSha256),
        };

        return new AccessToken(new JsonWebTokenHandler().CreateToken(descriptor), expiresAt);
    }

    public string CreateRefreshToken() =>
        Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));

    public string HashRefreshToken(string refreshToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    public static SymmetricSecurityKey CreateSigningKey(string key) => new(Encoding.UTF8.GetBytes(key));
}
