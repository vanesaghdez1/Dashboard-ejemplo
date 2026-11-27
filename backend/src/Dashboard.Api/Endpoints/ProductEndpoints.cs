using Dashboard.Api.Auth;
using Dashboard.Application.Common;
using Dashboard.Application.Features.Products;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Dashboard.Api.Endpoints;

public static class ProductEndpoints
{
    public const string ExcelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        // ---------- Lectura: cualquier usuario con sesión ----------
        var group = app.MapGroup("/api/products").WithTags("Products").RequireAuthorization();

        // GET /api/products?search=mouse&page=1&pageSize=10
        group.MapGet("/", async (string? search, int? page, int? pageSize, ProductService service, CancellationToken ct) =>
                TypedResults.Ok(await service.GetPagedAsync(new ProductQuery(search, page ?? 1, pageSize ?? 10), ct)))
            .WithName("GetProducts")
            .WithSummary("Paged product list with search");

        // GET /api/products/export?search=mouse  → archivo .xlsx
        group.MapGet("/export", async (string? search, ProductService service, IExcelExporter excel, CancellationToken ct) =>
            {
                var products = await service.GetAllAsync(search, ct);
                return TypedResults.File(excel.ExportProducts(products), ExcelContentType,
                    $"products-{DateTime.Now:yyyy-MM-dd}.xlsx");
            })
            .WithSummary("Exports products to Excel");

        // ---------- Escritura: solo Admin ----------
        var admin = app.MapGroup("/api/products").WithTags("Products").RequireAuthorization(Policies.CanManageProducts);

        admin.MapGet("/{id:guid}", async Task<Results<Ok<ProductDetailDto>, NotFound>> (
                Guid id, ProductService service, CancellationToken ct) =>
                await service.GetByIdAsync(id, ct) is { } product ? TypedResults.Ok(product) : TypedResults.NotFound())
            .WithSummary("Product details (including cost) for editing");

        admin.MapPost("/", async (CreateProductRequest request, ProductService service, CancellationToken ct) =>
            {
                var product = await service.CreateAsync(request, ct);
                return TypedResults.Created($"/api/products/{product.Id}", product);
            })
            .AddEndpointFilter<ValidationFilter<CreateProductRequest>>()
            .WithSummary("Creates a product");

        admin.MapPut("/{id:guid}", async Task<Results<Ok<ProductDetailDto>, NotFound>> (
                Guid id, UpdateProductRequest request, ProductService service, CancellationToken ct) =>
                await service.UpdateAsync(id, request, ct) is { } product ? TypedResults.Ok(product) : TypedResults.NotFound())
            .AddEndpointFilter<ValidationFilter<UpdateProductRequest>>()
            .WithSummary("Updates a product (the SKU cannot be changed)");

        admin.MapDelete("/{id:guid}", async Task<Results<NoContent, NotFound, ProblemHttpResult>> (
                Guid id, ProductService service, CancellationToken ct) =>
                await service.DeleteAsync(id, ct) switch
                {
                    DeleteProductResult.Deleted => TypedResults.NoContent(),
                    DeleteProductResult.HasSales => TypedResults.Problem(
                        title: "Cannot delete: this product has recorded sales",
                        detail: "Deleting it would change historical reports.",
                        statusCode: StatusCodes.Status409Conflict),
                    _ => TypedResults.NotFound(),
                })
            .WithSummary("Deletes a product with no sales (409 if it has sales)");

        // GET /api/categories  (para el select del formulario)
        app.MapGet("/api/categories", async (ProductService service, CancellationToken ct) =>
                TypedResults.Ok(await service.GetCategoriesAsync(ct)))
            .WithTags("Products")
            .RequireAuthorization()
            .WithSummary("Category list");

        return app;
    }
}
