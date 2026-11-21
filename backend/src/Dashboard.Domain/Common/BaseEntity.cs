namespace Dashboard.Domain.Common;

/// <summary>
/// Clase base de todas las entidades: identificador y fecha de creación.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
