using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Venta (ticket) realizada en una sucursal.</summary>
public class Sale : BaseEntity
{
    public DateTime Date { get; set; }

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public ICollection<SaleItem> Items { get; set; } = [];

    public decimal Total { get; set; }

    /// <summary>Agrega un renglón y recalcula el total.</summary>
    public void AddItem(Product product, int quantity)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);

        Items.Add(new SaleItem
        {
            ProductId = product.Id,
            Quantity = quantity,
            UnitPrice = product.Price,
            UnitCost = product.Cost,
        });
        Total = Items.Sum(i => i.Subtotal);
    }
}
