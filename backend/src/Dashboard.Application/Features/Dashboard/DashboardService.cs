using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Dashboard;

/// <summary>
/// Caso de uso: calcular los KPIs del dashboard.
/// Las agregaciones (SUM, COUNT, GROUP BY) se ejecutan en la base de datos, no en memoria.
/// </summary>
public class DashboardService(IAppDbContext db)
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(DashboardFilter filter, CancellationToken ct)
    {
        var sales = ApplyFilter(db.Sales.AsNoTracking(), filter);
        var items = sales.SelectMany(s => s.Items);

        var revenue = await sales.SumAsync(s => (decimal?)s.Total, ct) ?? 0;
        var orders = await sales.CountAsync(ct);
        var grossMargin = await items.SumAsync(i => (decimal?)(i.Quantity * (i.UnitPrice - i.UnitCost)), ct) ?? 0;
        var lowStock = await db.Products.CountAsync(p => p.Stock <= p.MinStock, ct);

        var byMonth = await sales
            .GroupBy(s => new { s.Date.Year, s.Date.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlySalesDto(g.Key.Year, g.Key.Month, g.Sum(s => s.Total), g.Count()))
            .ToListAsync(ct);

        // Importante: ordenar ANTES de proyectar al DTO, para que EF lo traduzca a ORDER BY en SQL.
        var topProducts = await items
            .GroupBy(i => new { i.ProductId, i.Product.Name })
            .OrderByDescending(g => g.Sum(i => i.Quantity * i.UnitPrice))
            .Take(5)
            .Select(g => new TopProductDto(
                g.Key.ProductId,
                g.Key.Name,
                g.Sum(i => i.Quantity),
                g.Sum(i => i.Quantity * i.UnitPrice)))
            .ToListAsync(ct);

        var byBranch = await sales
            .GroupBy(s => new { s.BranchId, s.Branch.Name })
            .OrderByDescending(g => g.Sum(s => s.Total))
            .Select(g => new BranchSalesDto(g.Key.BranchId, g.Key.Name, g.Sum(s => s.Total), g.Count()))
            .ToListAsync(ct);

        var kpis = new KpisDto(
            Revenue: revenue,
            Orders: orders,
            AverageTicket: orders == 0 ? 0 : Math.Round(revenue / orders, 2),
            GrossMargin: grossMargin,
            LowStockProducts: lowStock);

        return new DashboardSummaryDto(kpis, byMonth, topProducts, byBranch);
    }

    private static IQueryable<Sale> ApplyFilter(IQueryable<Sale> query, DashboardFilter filter)
    {
        if (filter.From is { } from)
        {
            var fromUtc = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(s => s.Date >= fromUtc);
        }

        if (filter.To is { } to)
        {
            // "Hasta" es inclusivo: tomamos todo el día.
            var toUtc = to.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(s => s.Date < toUtc);
        }

        if (filter.BranchId is { } branchId)
            query = query.Where(s => s.BranchId == branchId);

        return query;
    }
}
