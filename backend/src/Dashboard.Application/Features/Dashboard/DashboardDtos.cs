namespace Dashboard.Application.Features.Dashboard;

/// <summary>Filtros que llegan desde el frontend.</summary>
public record DashboardFilter(DateOnly? From, DateOnly? To, Guid? BranchId);

/// <summary>Todo lo que necesita la pantalla principal del dashboard en una sola llamada.</summary>
public record DashboardSummaryDto(
    KpisDto Kpis,
    IReadOnlyList<MonthlySalesDto> SalesByMonth,
    IReadOnlyList<TopProductDto> TopProducts,
    IReadOnlyList<BranchSalesDto> SalesByBranch,
    IReadOnlyList<DailySalesDto> SalesByDay,
    PeriodComparisonDto? Previous);

public record KpisDto(
    decimal Revenue,
    int Orders,
    decimal AverageTicket,
    decimal GrossMargin,
    int LowStockProducts);

public record MonthlySalesDto(int Year, int Month, decimal Revenue, int Orders);

public record TopProductDto(Guid ProductId, string Name, int Units, decimal Revenue);

public record BranchSalesDto(Guid BranchId, string Branch, decimal Revenue, int Orders);

/// <summary>Ventas de un día (alimenta el mapa de calor "ritmo diario").</summary>
public record DailySalesDto(DateOnly Date, decimal Revenue, int Orders);

/// <summary>
/// KPIs del periodo inmediatamente anterior con la misma duración
/// (p. ej. últimos 30 días vs los 30 días previos). Null si no hay rango de fechas.
/// </summary>
public record PeriodComparisonDto(DateOnly From, DateOnly To, decimal Revenue, int Orders, decimal AverageTicket, decimal GrossMargin);
