namespace Dashboard.Application.Features.Products;

/// <summary>Fila de la tabla de productos (sin costo: el costo es dato interno).</summary>
public record ProductDto(
    Guid Id,
    string Sku,
    string Name,
    string Category,
    decimal Price,
    int Stock,
    int MinStock,
    bool IsLowStock);

/// <summary>Producto completo para el formulario de edición (incluye costo y categoría).</summary>
public record ProductDetailDto(
    Guid Id,
    string Sku,
    string Name,
    Guid CategoryId,
    decimal Price,
    decimal Cost,
    int Stock,
    int MinStock);

public record ProductQuery(string? Search, int Page = 1, int PageSize = 10);

/// <summary>Campos que comparten crear y editar (permite validarlos con un solo validador).</summary>
public interface IProductFields
{
    string Name { get; }
    Guid CategoryId { get; }
    decimal Price { get; }
    decimal Cost { get; }
    int Stock { get; }
    int MinStock { get; }
}

public record CreateProductRequest(
    string Sku,
    string Name,
    Guid CategoryId,
    decimal Price,
    decimal Cost,
    int Stock,
    int MinStock) : IProductFields;

/// <summary>El SKU no se edita: es el identificador del producto en ventas y reportes.</summary>
public record UpdateProductRequest(
    string Name,
    Guid CategoryId,
    decimal Price,
    decimal Cost,
    int Stock,
    int MinStock) : IProductFields;

public record CategoryDto(Guid Id, string Name);

/// <summary>Resultado de eliminar: o se eliminó, o no existía, o no se puede por tener ventas.</summary>
public enum DeleteProductResult
{
    Deleted,
    NotFound,
    HasSales,
}
