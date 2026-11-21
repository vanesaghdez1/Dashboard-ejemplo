namespace Dashboard.Domain.Entities;

/// <summary>Roles del sistema. Se guardan como texto en la base de datos.</summary>
public enum UserRole
{
    /// <summary>Ve y administra todo.</summary>
    Admin,

    /// <summary>Gerente de sucursal: ve el dashboard solo de su sucursal.</summary>
    Manager,

    /// <summary>Vendedor: solo catálogo e inventario, sin cifras financieras.</summary>
    Seller,
}
