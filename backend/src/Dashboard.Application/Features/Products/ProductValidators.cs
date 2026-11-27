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
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(30).WithMessage("SKU cannot be longer than 30 characters.")
            .Matches("^[A-Za-z0-9-]+$").WithMessage("SKU can only contain letters, numbers and hyphens.")
            .MustAsync(async (sku, ct) => !await db.Products.AnyAsync(p => p.Sku == sku.Trim().ToUpper(), ct))
            .WithMessage("A product with this SKU already exists.");

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
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name cannot be longer than 200 characters.");

        RuleFor(x => x.CategoryId)
            .MustAsync(async (id, ct) => await db.Categories.AnyAsync(c => c.Id == id, ct))
            .WithMessage("Select a valid category.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.")
            // Regla de negocio: no vender por debajo del costo.
            .GreaterThanOrEqualTo(x => x.Cost).WithMessage("Price cannot be lower than cost.");

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Cost cannot be negative.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.");

        RuleFor(x => x.MinStock)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum stock cannot be negative.");
    }
}
