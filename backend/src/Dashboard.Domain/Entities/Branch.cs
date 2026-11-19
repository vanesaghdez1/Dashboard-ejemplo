using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Sucursal de la empresa.</summary>
public class Branch : BaseEntity
{
    public required string Name { get; set; }
    public required string City { get; set; }

    public ICollection<Sale> Sales { get; set; } = [];
}
