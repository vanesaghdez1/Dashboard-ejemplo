using Dashboard.Application.Features.Products;

namespace Dashboard.Api.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products").WithTags("Products");

        // GET /api/products?search=mouse&page=1&pageSize=10
        group.MapGet("/", async (
                string? search, int? page, int? pageSize,
                ProductService service, CancellationToken ct) =>
            TypedResults.Ok(await service.GetPagedAsync(new ProductQuery(search, page ?? 1, pageSize ?? 10), ct)))
            .WithName("GetProducts")
            .WithSummary("Lista paginada de productos con búsqueda");

        return app;
    }
}
