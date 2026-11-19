using Dashboard.Application.Common;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Branches;

public record BranchDto(Guid Id, string Name, string City);

/// <summary>Caso de uso: catálogo de sucursales (para el filtro del dashboard).</summary>
public class BranchService(IAppDbContext db, ICurrentUser currentUser)
{
    public async Task<IReadOnlyList<BranchDto>> GetAllAsync(CancellationToken ct)
    {
        var branches = db.Branches.AsNoTracking();

        // Solo el Admin ve todas las sucursales; los demás, únicamente la suya.
        if (currentUser.Role != UserRole.Admin)
            branches = branches.Where(b => b.Id == currentUser.BranchId);

        return await branches
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto(b.Id, b.Name, b.City))
            .ToListAsync(ct);
    }
}
