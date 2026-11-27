using Dashboard.Api.Auth;
using Dashboard.Application.Common;
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
            .WithSummary("KPIs, monthly sales, top products and sales by branch");

        // GET /api/dashboard/export?from=...&to=...&branchId=...  → archivo .xlsx con 4 hojas
        group.MapGet("/export", async (
                DateOnly? from, DateOnly? to, Guid? branchId,
                DashboardService service, IExcelExporter excel, CancellationToken ct) =>
            {
                var filter = new DashboardFilter(from, to, branchId);
                var summary = await service.GetSummaryAsync(filter, ct); // mismo filtro de seguridad por rol
                return TypedResults.File(excel.ExportDashboard(summary, filter), ProductEndpoints.ExcelContentType,
                    $"sales-report-{DateTime.Now:yyyy-MM-dd}.xlsx");
            })
            .WithSummary("Exports the dashboard report to Excel");

        return app;
    }
}
