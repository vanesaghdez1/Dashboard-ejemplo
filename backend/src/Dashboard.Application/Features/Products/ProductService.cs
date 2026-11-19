using Dashboard.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Products;

public record ProductDto(
    Guid Id,
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int Stock,
    int MinStock,
    bool IsLowStock);

public record ProductQuery(string? Search, int Page = 1, int PageSize = 10);

/// <summary>Caso de uso: listar productos con búsqueda y paginación (para la tabla).</summary>
public class ProductService(IAppDbContext db)
{
    public async Task<PagedResult<ProductDto>> GetPagedAsync(ProductQuery query, CancellationToken ct)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var products = db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            products = products.Where(p => p.Name.ToLower().Contains(term) || p.Sku.ToLower().Contains(term));
        }

        var total = await products.CountAsync(ct);

        var items = await products
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto(
                p.Id, p.Sku, p.Name, p.Category.Name, p.Price, p.Stock, p.MinStock, p.Stock <= p.MinStock))
            .ToListAsync(ct);

        return new PagedResult<ProductDto>(items, page, pageSize, total);
    }
}
