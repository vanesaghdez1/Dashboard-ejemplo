using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Cliente que realiza compras.</summary>
public class Customer : BaseEntity
{
    public required string Name { get; set; }
    public required string Email { get; set; }

    public ICollection<Sale> Sales { get; set; } = [];
}
