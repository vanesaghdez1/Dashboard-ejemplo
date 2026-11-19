using FluentValidation;

namespace Dashboard.Api.Endpoints;

/// <summary>
/// Filtro reutilizable: antes de ejecutar el endpoint, busca el validador de T y lo corre.
/// Si hay errores responde 400 con { errors: { "Price": ["El precio debe ser mayor a 0."] } }.
/// Uso:  .AddEndpointFilter&lt;ValidationFilter&lt;CreateProductRequest&gt;&gt;()
/// </summary>
public class ValidationFilter<T> : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var argument = context.Arguments.OfType<T>().FirstOrDefault();
        if (argument is null)
            return TypedResults.Problem(title: "El cuerpo de la petición es inválido", statusCode: StatusCodes.Status400BadRequest);

        var validator = context.HttpContext.RequestServices.GetRequiredService<IValidator<T>>();
        var result = await validator.ValidateAsync(argument, context.HttpContext.RequestAborted);

        if (!result.IsValid)
            return TypedResults.ValidationProblem(result.ToDictionary(), title: "Revisa los datos del formulario");

        return await next(context);
    }
}
