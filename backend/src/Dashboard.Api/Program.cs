using Dashboard.Api.Endpoints;
using Dashboard.Application;
using Dashboard.Infrastructure;
using Dashboard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ---------- 1. Registro de servicios (inyección de dependencias) ----------
builder.Services.AddApplication();                              // casos de uso
builder.Services.AddInfrastructure(builder.Configuration);      // base de datos

builder.Services.AddOpenApi();       // genera la especificación OpenAPI (/openapi/v1.json)
builder.Services.AddProblemDetails(); // errores en formato estándar RFC 7807
builder.Services.AddHealthChecks();

// CORS: permite que el frontend (otro origen/puerto) llame a esta API desde el navegador.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy("frontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// ---------- 2. Pipeline HTTP (orden importa) ----------
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors("frontend");

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
app.MapDashboardEndpoints();
app.MapProductEndpoints();
app.MapBranchEndpoints();

app.Run();

// Necesario para pruebas de integración (WebApplicationFactory<Program>).
public partial class Program;
