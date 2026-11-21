using Dashboard.Domain.Common;

namespace Dashboard.Domain.Entities;

/// <summary>Renglón de una venta. Guarda precio y costo del momento de la venta.</summary>
public class SaleItem : BaseEntity
{
    public Guid SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal UnitCost { get; set; }

    public decimal Subtotal => Quantity * UnitPrice;
}
