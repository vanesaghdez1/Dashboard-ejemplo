using System.Threading.RateLimiting;
using Dashboard.Api.Auth;
using Dashboard.Api.Endpoints;
using Dashboard.Application;
using Dashboard.Application.Common;
using Dashboard.Infrastructure;
using Dashboard.Infrastructure.Auth;
using Dashboard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ---------- 1. Registro de servicios (inyección de dependencias) ----------
builder.Services.AddApplication();                              // casos de uso
builder.Services.AddInfrastructure(builder.Configuration);      // base de datos, JWT, hashing

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();        // "quién hace la petición", leído del JWT

builder.Services.AddOpenApi();       // genera la especificación OpenAPI (/openapi/v1.json)
builder.Services.AddProblemDetails(); // errores en formato estándar RFC 7807
builder.Services.AddHealthChecks();

// Autenticación: "¿quién eres?" → se valida el JWT del header Authorization: Bearer <token>
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // conserva los nombres de claims tal cual ("role", "sub"...)
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = TokenService.CreateSigningKey(jwt.Key),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = AppClaims.Name,
            RoleClaimType = AppClaims.Role,
        };
    });

// Autorización: "¿puedes entrar aquí?" → políticas por rol
builder.Services.AddAuthorization(Policies.Configure);

// Límite de intentos de login por IP (frena ataques de fuerza bruta)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthEndpoints.LoginRateLimitPolicy, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// CORS: permite que el frontend (otro origen/puerto) llame a esta API desde el navegador.
// AllowCredentials es necesario para que viaje la cookie del refresh token.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy("frontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

var app = builder.Build();

// ---------- 2. Pipeline HTTP (el orden importa) ----------
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();   // primero: identifica al usuario a partir del token
app.UseAuthorization();    // después: decide si puede entrar al endpoint

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // documentación interactiva en /scalar

    // Aplica migraciones pendientes y siembra datos de demo al arrancar.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<DataSeeder>().SeedAsync();
}

// ---------- 3. Endpoints ----------
app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapDashboardEndpoints();
app.MapProductEndpoints();
app.MapBranchEndpoints();

app.Run();

// Necesario para pruebas de integración (WebApplicationFactory<Program>).
public partial class Program;
