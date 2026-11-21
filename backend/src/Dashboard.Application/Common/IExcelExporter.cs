using Dashboard.Application.Features.Dashboard;
using Dashboard.Application.Features.Products;

namespace Dashboard.Application.Common;

/// <summary>
/// Contrato para generar archivos Excel. La implementación (ClosedXML) vive en Infrastructure:
/// si mañana se necesita PDF, se agrega otra implementación sin tocar los casos de uso.
/// </summary>
public interface IExcelExporter
{
    byte[] ExportDashboard(DashboardSummaryDto summary, DashboardFilter filter);
    byte[] ExportProducts(IReadOnlyList<ProductDto> products);
}
