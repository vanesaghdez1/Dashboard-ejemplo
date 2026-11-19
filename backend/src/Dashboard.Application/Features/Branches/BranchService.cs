using Dashboard.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Branches;

public record BranchDto(Guid Id, string Name, string City);

/// <summary>Caso de uso: catálogo de sucursales (para el filtro del dashboard).</summary>
public class BranchService(IAppDbContext db)
{
    public async Task<IReadOnlyList<BranchDto>> GetAllAsync(CancellationToken ct) =>
        await db.Branches.AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto(b.Id, b.Name, b.City))
            .ToListAsync(ct);
}
