using Dashboard.Application.Common;
using Dashboard.Application.Features.Auth;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Dashboard.Api.Endpoints;

public static class AuthEndpoints
{
    public const string LoginRateLimitPolicy = "login";
    private const string RefreshCookie = "refresh_token";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/login  { email, password }
        group.MapPost("/login", async Task<Results<Ok<AuthResponse>, ValidationProblem, ProblemHttpResult>> (
                LoginRequest request, AuthService auth, HttpContext http, IHostEnvironment env, CancellationToken ct) =>
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                    {
                        ["credentials"] = ["Email and password are required."],
                    });
                }

                var result = await auth.LoginAsync(request, ct);
                if (result is null)
                    return TypedResults.Problem(title: "Incorrect email or password", statusCode: StatusCodes.Status401Unauthorized);

                SetRefreshCookie(http, result, env);
                return TypedResults.Ok(result.Response);
            })
            .AllowAnonymous()
            .RequireRateLimiting(LoginRateLimitPolicy)
            .WithSummary("Signs in. Returns the access token and sets the refresh token in an HttpOnly cookie");

        // POST /api/auth/refresh  (sin body: usa la cookie)
        group.MapPost("/refresh", async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> (
                AuthService auth, HttpContext http, IHostEnvironment env, CancellationToken ct) =>
            {
                if (!http.Request.Cookies.TryGetValue(RefreshCookie, out var token) || string.IsNullOrEmpty(token))
                    return TypedResults.Unauthorized();

                var result = await auth.RefreshAsync(token, ct);
                if (result is null)
                {
                    DeleteRefreshCookie(http);
                    return TypedResults.Unauthorized();
                }

                SetRefreshCookie(http, result, env);
                return TypedResults.Ok(result.Response);
            })
            .AllowAnonymous()
            .WithSummary("Renews the session using the refresh token cookie (with rotation)");

        // POST /api/auth/logout
        group.MapPost("/logout", async (AuthService auth, HttpContext http, CancellationToken ct) =>
            {
                if (http.Request.Cookies.TryGetValue(RefreshCookie, out var token) && !string.IsNullOrEmpty(token))
                    await auth.LogoutAsync(token, ct);

                DeleteRefreshCookie(http);
                return TypedResults.NoContent();
            })
            .AllowAnonymous()
            .WithSummary("Signs out: revokes the refresh token and clears the cookie");

        // GET /api/auth/me
        group.MapGet("/me", async Task<Results<Ok<UserDto>, UnauthorizedHttpResult>> (
                ICurrentUser currentUser, AuthService auth, CancellationToken ct) =>
            {
                var user = currentUser.UserId is { } id ? await auth.GetUserAsync(id, ct) : null;
                return user is null ? TypedResults.Unauthorized() : TypedResults.Ok(user);
            })
            .RequireAuthorization()
            .WithSummary("Current user details");

        return app;
    }

    private static void SetRefreshCookie(HttpContext http, AuthResult result, IHostEnvironment env) =>
        http.Response.Cookies.Append(RefreshCookie, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,                     // JavaScript no puede leerla (protege contra XSS)
            Secure = !env.IsDevelopment(),       // en producción solo viaja por HTTPS
            SameSite = SameSiteMode.Strict,      // no se envía desde otros sitios (protege contra CSRF)
            Path = "/api/auth",                  // solo se manda a los endpoints de auth, no a cada petición
            Expires = result.RefreshTokenExpiresAt,
        });

    private static void DeleteRefreshCookie(HttpContext http) =>
        http.Response.Cookies.Delete(RefreshCookie, new CookieOptions { Path = "/api/auth" });
}
