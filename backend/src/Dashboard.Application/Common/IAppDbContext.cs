using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Common;

/// <summary>
/// Contrato de acceso a datos. Application solo conoce esta interfaz;
/// la implementación real (PostgreSQL) vive en Infrastructure.
/// </summary>
public interface IAppDbContext
{
    DbSet<Branch> Branches { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Sale> Sales { get; }
    DbSet<SaleItem> SaleItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
