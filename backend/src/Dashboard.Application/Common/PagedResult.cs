namespace Dashboard.Application.Common;

/// <summary>Respuesta paginada genérica para tablas del frontend.</summary>
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
