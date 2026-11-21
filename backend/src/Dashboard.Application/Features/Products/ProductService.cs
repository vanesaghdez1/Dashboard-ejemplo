using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Products;

/// <summary>
/// Casos de uso de productos: listar, consultar, crear, editar y eliminar.
/// Los datos ya llegan validados (ver ProductValidators.cs).
/// </summary>
public class ProductService(IAppDbContext db)
{
    public async Task<PagedResult<ProductDto>> GetPagedAsync(ProductQuery query, CancellationToken ct)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var products = Search(query.Search);
        var total = await products.CountAsync(ct);

        var items = await products
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync(ct);

        return new PagedResult<ProductDto>(items, page, pageSize, total);
    }

    /// <summary>Todos los productos que coinciden con la búsqueda (para exportar a Excel).</summary>
    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(string? search, CancellationToken ct) =>
        await Search(search).OrderBy(p => p.Name).Select(ToDto).ToListAsync(ct);

    public async Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct) =>
        await db.Products.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProductDetailDto(p.Id, p.Sku, p.Name, p.CategoryId, p.Price, p.Cost, p.Stock, p.MinStock))
            .FirstOrDefaultAsync(ct);

    public async Task<ProductDetailDto> CreateAsync(CreateProductRequest request, CancellationToken ct)
    {
        var product = new Product
        {
            Sku = request.Sku.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            CategoryId = request.CategoryId,
            Price = request.Price,
            Cost = request.Cost,
            Stock = request.Stock,
            MinStock = request.MinStock,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);

        return new ProductDetailDto(product.Id, product.Sku, product.Name, product.CategoryId,
            product.Price, product.Cost, product.Stock, product.MinStock);
    }

    /// <summary>Devuelve null si el producto no existe.</summary>
    public async Task<ProductDetailDto?> UpdateAsync(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return null;

        product.Name = request.Name.Trim();
        product.CategoryId = request.CategoryId;
        product.Price = request.Price;
        product.Cost = request.Cost;
        product.Stock = request.Stock;
        product.MinStock = request.MinStock;

        await db.SaveChangesAsync(ct); // EF detecta qué cambió y genera el UPDATE

        return new ProductDetailDto(product.Id, product.Sku, product.Name, product.CategoryId,
            product.Price, product.Cost, product.Stock, product.MinStock);
    }

    /// <summary>
    /// Regla de negocio: un producto con ventas no se borra (rompería los reportes históricos).
    /// </summary>
    public async Task<DeleteProductResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return DeleteProductResult.NotFound;

        if (await db.SaleItems.AnyAsync(i => i.ProductId == id, ct))
            return DeleteProductResult.HasSales;

        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        return DeleteProductResult.Deleted;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct) =>
        await db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync(ct);

    private IQueryable<Product> Search(string? search)
    {
        var products = db.Products.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            products = products.Where(p => p.Name.ToLower().Contains(term) || p.Sku.ToLower().Contains(term));
        }
        return products;
    }

    private static readonly System.Linq.Expressions.Expression<Func<Product, ProductDto>> ToDto = p =>
        new ProductDto(p.Id, p.Sku, p.Name, p.Category.Name, p.Price, p.Stock, p.MinStock, p.Stock <= p.MinStock);
}
