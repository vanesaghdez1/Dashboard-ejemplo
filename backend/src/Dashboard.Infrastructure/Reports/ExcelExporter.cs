using System.Globalization;
using ClosedXML.Excel;
using Dashboard.Application.Common;
using Dashboard.Application.Features.Dashboard;
using Dashboard.Application.Features.Products;

namespace Dashboard.Infrastructure.Reports;

/// <summary>Genera reportes .xlsx con ClosedXML (sin necesidad de tener Excel instalado).</summary>
public class ExcelExporter : IExcelExporter
{
    private const string MoneyFormat = "\"$\"#,##0.00";
    private const string IntFormat = "#,##0";
    private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("es-MX");
    private static readonly XLColor HeaderFill = XLColor.FromHtml("#2A78D6");

    public byte[] ExportDashboard(DashboardSummaryDto summary, DashboardFilter filter)
    {
        using var workbook = new XLWorkbook();

        // Hoja 1: resumen con KPIs
        var ws = workbook.Worksheets.Add("Resumen");
        ws.Cell("A1").Value = "Reporte de ventas · Ventas MX";
        ws.Cell("A1").Style.Font.SetBold().Font.SetFontSize(14);
        ws.Cell("A2").Value = $"Periodo: {FormatDate(filter.From) ?? "inicio"} a {FormatDate(filter.To) ?? "hoy"}";
        ws.Cell("A3").Value = $"Sucursal: {(summary.SalesByBranch.Count == 1 ? summary.SalesByBranch[0].Branch : "Todas")}";
        ws.Cell("A4").Value = $"Generado: {DateTime.Now.ToString("dd/MM/yyyy HH:mm", Mx)}";
        ws.Range("A2:A4").Style.Font.SetFontColor(XLColor.Gray);

        var k = summary.Kpis;
        var kpis = new (string Label, object Value, string Format)[]
        {
            ("Ingresos", k.Revenue, MoneyFormat),
            ("Ventas", k.Orders, IntFormat),
            ("Ticket promedio", k.AverageTicket, MoneyFormat),
            ("Margen bruto", k.GrossMargin, MoneyFormat),
            ("Margen %", k.Revenue == 0 ? 0 : k.GrossMargin / k.Revenue, "0.0%"),
            ("Productos con stock bajo", k.LowStockProducts, IntFormat),
        };
        WriteHeader(ws, 6, "Indicador", "Valor");
        for (var i = 0; i < kpis.Length; i++)
        {
            ws.Cell(7 + i, 1).Value = kpis[i].Label;
            ws.Cell(7 + i, 2).Value = XLCellValue.FromObject(kpis[i].Value);
            ws.Cell(7 + i, 2).Style.NumberFormat.Format = kpis[i].Format;
        }
        ws.Columns().AdjustToContents();

        // Hoja 2: ventas por mes
        AddTable(workbook, "Ventas por mes", ["Mes", "Ingresos", "Ventas"],
            summary.SalesByMonth.Select(m => new object[]
            {
                new DateTime(m.Year, m.Month, 1).ToString("MMMM yyyy", Mx), m.Revenue, m.Orders,
            }),
            [null, MoneyFormat, IntFormat]);

        // Hoja 3: top productos
        AddTable(workbook, "Top productos", ["Producto", "Unidades", "Ingresos"],
            summary.TopProducts.Select(p => new object[] { p.Name, p.Units, p.Revenue }),
            [null, IntFormat, MoneyFormat]);

        // Hoja 4: por sucursal
        AddTable(workbook, "Por sucursal", ["Sucursal", "Ventas", "Ingresos"],
            summary.SalesByBranch.Select(b => new object[] { b.Branch, b.Orders, b.Revenue }),
            [null, IntFormat, MoneyFormat]);

        return Save(workbook);
    }

    public byte[] ExportProducts(IReadOnlyList<ProductDto> products)
    {
        using var workbook = new XLWorkbook();
        AddTable(workbook, "Productos", ["SKU", "Producto", "Categoría", "Precio", "Stock", "Stock mínimo", "Estado"],
            products.Select(p => new object[]
            {
                p.Sku, p.Name, p.Category, p.Price, p.Stock, p.MinStock, p.IsLowStock ? "Resurtir" : "Disponible",
            }),
            [null, null, null, MoneyFormat, IntFormat, IntFormat, null]);
        return Save(workbook);
    }

    /// <summary>Crea una hoja con encabezado, filas, formato de números y filtro automático.</summary>
    private static void AddTable(XLWorkbook workbook, string sheetName, string[] headers,
        IEnumerable<object[]> rows, string?[] formats)
    {
        var ws = workbook.Worksheets.Add(sheetName);
        WriteHeader(ws, 1, headers);

        var r = 2;
        foreach (var row in rows)
        {
            for (var c = 0; c < row.Length; c++)
            {
                var cell = ws.Cell(r, c + 1);
                cell.Value = XLCellValue.FromObject(row[c]);
                if (formats[c] is { } format) cell.Style.NumberFormat.Format = format;
            }
            r++;
        }

        if (r > 2) ws.Range(1, 1, r - 1, headers.Length).SetAutoFilter();
        ws.SheetView.FreezeRows(1); // el encabezado se queda fijo al hacer scroll
        ws.Columns().AdjustToContents();
    }

    private static void WriteHeader(IXLWorksheet ws, int row, params string[] headers)
    {
        for (var c = 0; c < headers.Length; c++)
        {
            var cell = ws.Cell(row, c + 1);
            cell.Value = headers[c];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White).Fill.SetBackgroundColor(HeaderFill);
        }
    }

    private static byte[] Save(XLWorkbook workbook)
    {
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string? FormatDate(DateOnly? date) => date?.ToString("dd/MM/yyyy", Mx);
}
