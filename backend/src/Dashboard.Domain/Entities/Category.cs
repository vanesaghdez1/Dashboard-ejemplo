using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Categoría de productos.</summary>
public class Category : BaseEntity
{
    public required string Name { get; set; }

    public ICollection<Product> Products { get; set; } = [];
}
