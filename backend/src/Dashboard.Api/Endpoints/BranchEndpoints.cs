using Dashboard.Application.Features.Branches;

namespace Dashboard.Api.Endpoints;

public static class BranchEndpoints
{
    public static IEndpointRouteBuilder MapBranchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/branches").WithTags("Branches").RequireAuthorization();

        group.MapGet("/", async (BranchService service, CancellationToken ct) =>
                TypedResults.Ok(await service.GetAllAsync(ct)))
            .WithName("GetBranches")
            .WithSummary("Branch list");

        return app;
    }
}
