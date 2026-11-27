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
    private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("en-US");
    private static readonly XLColor HeaderFill = XLColor.FromHtml("#2A78D6");

    public byte[] ExportDashboard(DashboardSummaryDto summary, DashboardFilter filter)
    {
        using var workbook = new XLWorkbook();

        // Hoja 1: resumen con KPIs
        var ws = workbook.Worksheets.Add("Summary");
        ws.Cell("A1").Value = "Sales report · Ventas MX";
        ws.Cell("A1").Style.Font.SetBold().Font.SetFontSize(14);
        ws.Cell("A2").Value = $"Period: {FormatDate(filter.From) ?? "start"} to {FormatDate(filter.To) ?? "today"}";
        ws.Cell("A3").Value = $"Branch: {(summary.SalesByBranch.Count == 1 ? summary.SalesByBranch[0].Branch : "All")}";
        ws.Cell("A4").Value = $"Generated: {DateTime.Now.ToString("MM/dd/yyyy HH:mm", Mx)}";
        ws.Range("A2:A4").Style.Font.SetFontColor(XLColor.Gray);

        var k = summary.Kpis;
        var kpis = new (string Label, object Value, string Format)[]
        {
            ("Revenue", k.Revenue, MoneyFormat),
            ("Orders", k.Orders, IntFormat),
            ("Average ticket", k.AverageTicket, MoneyFormat),
            ("Gross margin", k.GrossMargin, MoneyFormat),
            ("Margin %", k.Revenue == 0 ? 0 : k.GrossMargin / k.Revenue, "0.0%"),
            ("Low-stock products", k.LowStockProducts, IntFormat),
        };
        WriteHeader(ws, 6, "Metric", "Value");
        for (var i = 0; i < kpis.Length; i++)
        {
            ws.Cell(7 + i, 1).Value = kpis[i].Label;
            ws.Cell(7 + i, 2).Value = XLCellValue.FromObject(kpis[i].Value);
            ws.Cell(7 + i, 2).Style.NumberFormat.Format = kpis[i].Format;
        }
        ws.Columns().AdjustToContents();

        // Hoja 2: ventas por mes
        AddTable(workbook, "Monthly sales", ["Month", "Revenue", "Orders"],
            summary.SalesByMonth.Select(m => new object[]
            {
                new DateTime(m.Year, m.Month, 1).ToString("MMMM yyyy", Mx), m.Revenue, m.Orders,
            }),
            [null, MoneyFormat, IntFormat]);

        // Hoja 3: top productos
        AddTable(workbook, "Top products", ["Product", "Units", "Revenue"],
            summary.TopProducts.Select(p => new object[] { p.Name, p.Units, p.Revenue }),
            [null, IntFormat, MoneyFormat]);

        // Hoja 4: por sucursal
        AddTable(workbook, "By branch", ["Branch", "Orders", "Revenue"],
            summary.SalesByBranch.Select(b => new object[] { b.Branch, b.Orders, b.Revenue }),
            [null, IntFormat, MoneyFormat]);

        return Save(workbook);
    }

    public byte[] ExportProducts(IReadOnlyList<ProductDto> products)
    {
        using var workbook = new XLWorkbook();
        AddTable(workbook, "Products", ["SKU", "Product", "Category", "Price", "Stock", "Min. stock", "Status"],
            products.Select(p => new object[]
            {
                p.Sku, p.Name, p.Category, p.Price, p.Stock, p.MinStock, p.IsLowStock ? "Reorder" : "In stock",
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

    private static string? FormatDate(DateOnly? date) => date?.ToString("MM/dd/yyyy", Mx);
}
