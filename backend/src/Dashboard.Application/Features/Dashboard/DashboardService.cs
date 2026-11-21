using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Dashboard;

/// <summary>
/// Caso de uso: calcular los KPIs del dashboard.
/// Las agregaciones (SUM, COUNT, GROUP BY) se ejecutan en la base de datos, no en memoria.
/// </summary>
public class DashboardService(IAppDbContext db, ICurrentUser currentUser)
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(DashboardFilter filter, CancellationToken ct)
    {
        // Seguridad a nivel de datos: un Gerente SIEMPRE ve solo su sucursal,
        // sin importar qué branchId haya mandado el frontend.
        if (currentUser.Role == UserRole.Manager)
            filter = filter with { BranchId = currentUser.BranchId };

        var sales = ApplyFilter(db.Sales.AsNoTracking(), filter);
        var items = sales.SelectMany(s => s.Items);

        var totals = await GetTotalsAsync(sales, ct);
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

        // Agrupar por año/mes/día (se traduce a GROUP BY en SQL); el DateOnly se arma ya en memoria.
        var byDay = (await sales
                .GroupBy(s => new { s.Date.Year, s.Date.Month, s.Date.Day })
                .Select(g => new { g.Key.Year, g.Key.Month, g.Key.Day, Revenue = g.Sum(s => s.Total), Orders = g.Count() })
                .ToListAsync(ct))
            .Select(d => new DailySalesDto(new DateOnly(d.Year, d.Month, d.Day), d.Revenue, d.Orders))
            .OrderBy(d => d.Date)
            .ToList();

        var kpis = new KpisDto(
            Revenue: totals.Revenue,
            Orders: totals.Orders,
            AverageTicket: AverageTicket(totals),
            GrossMargin: totals.GrossMargin,
            LowStockProducts: lowStock);

        var previous = await GetPreviousPeriodAsync(filter, ct);

        return new DashboardSummaryDto(kpis, byMonth, topProducts, byBranch, byDay, previous);
    }

    /// <summary>
    /// Mismos totales para el periodo anterior de igual duración. Así el frontend puede
    /// decir "+12 % vs periodo anterior" sin pedir otra llamada.
    /// </summary>
    private async Task<PeriodComparisonDto?> GetPreviousPeriodAsync(DashboardFilter filter, CancellationToken ct)
    {
        if (filter.From is not { } from || filter.To is not { } to || to < from)
            return null;

        var days = to.DayNumber - from.DayNumber + 1;
        var previousTo = from.AddDays(-1);
        var previousFrom = previousTo.AddDays(-(days - 1));

        // Solo comparamos si hay historial que cubra TODO el periodo anterior;
        // comparar contra un periodo a medias daría variaciones engañosas (+2,000 %).
        var scope = ApplyFilter(db.Sales.AsNoTracking(), filter with { From = null, To = null });
        var firstSale = await scope.MinAsync(s => (DateTime?)s.Date, ct);
        if (firstSale is null || DateOnly.FromDateTime(firstSale.Value) > previousFrom)
            return null;

        var previousSales = ApplyFilter(db.Sales.AsNoTracking(), filter with { From = previousFrom, To = previousTo });
        var totals = await GetTotalsAsync(previousSales, ct);

        // Sin ventas en el periodo anterior no hay contra qué comparar
        if (totals.Orders == 0)
            return null;

        return new PeriodComparisonDto(previousFrom, previousTo, totals.Revenue, totals.Orders, AverageTicket(totals), totals.GrossMargin);
    }

    private static async Task<Totals> GetTotalsAsync(IQueryable<Sale> sales, CancellationToken ct)
    {
        var revenue = await sales.SumAsync(s => (decimal?)s.Total, ct) ?? 0;
        var orders = await sales.CountAsync(ct);
        var grossMargin = await sales
            .SelectMany(s => s.Items)
            .SumAsync(i => (decimal?)(i.Quantity * (i.UnitPrice - i.UnitCost)), ct) ?? 0;
        return new Totals(revenue, orders, grossMargin);
    }

    private static decimal AverageTicket(Totals t) => t.Orders == 0 ? 0 : Math.Round(t.Revenue / t.Orders, 2);

    private sealed record Totals(decimal Revenue, int Orders, decimal GrossMargin);

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
