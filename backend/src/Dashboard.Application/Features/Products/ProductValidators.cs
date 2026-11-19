using Dashboard.Application.Common;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dashboard.Application.Features.Products;

// Los validadores son el "portero": revisan los datos ANTES de que lleguen al servicio.
// Si algo falla, la API responde 400 con la lista de errores por campo, y el frontend
// los muestra junto a cada input.

public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator(IAppDbContext db)
    {
        RuleFor(x => x.Sku)
            .Cascade(CascadeMode.Stop) // si una regla falla, no evalúa las siguientes (evita consultar la BD con un SKU vacío)
            .NotEmpty().WithMessage("El SKU es obligatorio.")
            .MaximumLength(30).WithMessage("El SKU no puede tener más de 30 caracteres.")
            .Matches("^[A-Za-z0-9-]+$").WithMessage("El SKU solo puede tener letras, números y guiones.")
            .MustAsync(async (sku, ct) => !await db.Products.AnyAsync(p => p.Sku == sku.Trim().ToUpper(), ct))
            .WithMessage("Ya existe un producto con ese SKU.");

        Include(new ProductFieldsValidator(db)); // + las reglas comunes
    }
}

public class UpdateProductValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductValidator(IAppDbContext db)
    {
        Include(new ProductFieldsValidator(db));
    }
}

/// <summary>Reglas comunes de crear y editar (escritas una sola vez).</summary>
public class ProductFieldsValidator : AbstractValidator<IProductFields>
{
    public ProductFieldsValidator(IAppDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es obligatorio.")
            .MaximumLength(200).WithMessage("El nombre no puede tener más de 200 caracteres.");

        RuleFor(x => x.CategoryId)
            .MustAsync(async (id, ct) => await db.Categories.AnyAsync(c => c.Id == id, ct))
            .WithMessage("Selecciona una categoría válida.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("El precio debe ser mayor a 0.")
            // Regla de negocio: no vender por debajo del costo.
            .GreaterThanOrEqualTo(x => x.Cost).WithMessage("El precio no puede ser menor que el costo.");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("El costo no puede ser negativo.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("El stock no puede ser negativo.");

        RuleFor(x => x.MinStock)
            .GreaterThanOrEqualTo(0).WithMessage("El stock mínimo no puede ser negativo.");
    }
}
