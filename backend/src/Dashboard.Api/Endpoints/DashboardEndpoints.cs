using Dashboard.Api.Auth;
using Dashboard.Application.Features.Dashboard;

namespace Dashboard.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        // Solo Admin y Gerente (el Vendedor recibe 403 Forbidden).
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization(Policies.CanViewDashboard);

        // GET /api/dashboard/summary?from=2026-01-01&to=2026-06-30&branchId=...
        group.MapGet("/summary", async (
                DateOnly? from, DateOnly? to, Guid? branchId,
                DashboardService service, CancellationToken ct) =>
            TypedResults.Ok(await service.GetSummaryAsync(new DashboardFilter(from, to, branchId), ct)))
            .WithName("GetDashboardSummary")
            .WithSummary("KPIs, ventas por mes, top productos y ventas por sucursal");

        return app;
    }
}
