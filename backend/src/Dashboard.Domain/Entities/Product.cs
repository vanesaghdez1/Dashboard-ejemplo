using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Producto del catálogo.</summary>
public class Product : BaseEntity
{
    public required string Sku { get; set; }
    public required string Name { get; set; }
    public decimal Price { get; set; }
    public decimal Cost { get; set; }
    public int Stock { get; set; }
    public int MinStock { get; set; }

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    /// <summary>Regla de negocio: el producto necesita resurtirse.</summary>
    public bool IsLowStock => Stock <= MinStock;
}
