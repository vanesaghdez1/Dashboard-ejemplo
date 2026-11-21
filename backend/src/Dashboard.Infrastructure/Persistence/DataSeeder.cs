using Dashboard.Application.Features.Auth;
using Dashboard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Dashboard.Infrastructure.Persistence;

/// <summary>
/// Genera datos de demostración realistas (12 meses de ventas) para que el dashboard
/// no se vea vacío. Usa una semilla fija: siempre genera los mismos datos.
/// </summary>
public class DataSeeder(AppDbContext db, IPasswordHasher passwordHasher, ILogger<DataSeeder> logger)
{
    /// <summary>Contraseña de las cuentas de demostración (pública a propósito: es un portafolio).</summary>
    public const string DemoPassword = "Demo123!";

    private readonly Random _rng = new(42);

    public async Task SeedAsync(CancellationToken ct = default)
    {
        // Cada bloque revisa por separado si ya existe, así una BD vieja recibe lo que le falte.
        await SeedSalesDataAsync(ct);
        await SeedUsersAsync(ct);
    }

    private async Task SeedUsersAsync(CancellationToken ct)
    {
        if (await db.Users.AnyAsync(ct))
            return;

        var cdmx = await db.Branches.FirstAsync(b => b.Name == "CDMX Centro", ct);
        var monterrey = await db.Branches.FirstAsync(b => b.Name == "Monterrey Valle", ct);

        var users = new List<User>
        {
            new() { Email = "admin@ventasmx.demo", FullName = "Andrea Admin", Role = UserRole.Admin },
            new() { Email = "gerente@ventasmx.demo", FullName = "Gabriel Gerente", Role = UserRole.Manager, BranchId = monterrey.Id },
            new() { Email = "vendedor@ventasmx.demo", FullName = "Valeria Vendedora", Role = UserRole.Seller, BranchId = cdmx.Id },
        };
        foreach (var user in users)
            user.PasswordHash = passwordHasher.Hash(user, DemoPassword);

        db.Users.AddRange(users);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Usuarios de demo creados: {Emails}", string.Join(", ", users.Select(u => u.Email)));
    }

    private async Task SeedSalesDataAsync(CancellationToken ct)
    {
        if (await db.Branches.AnyAsync(ct))
            return; // ya hay datos

        logger.LogInformation("Sembrando datos de demostración...");

        var branches = new List<Branch>
        {
            new() { Name = "CDMX Centro", City = "Ciudad de México" },
            new() { Name = "Monterrey Valle", City = "Monterrey" },
            new() { Name = "Guadalajara Chapultepec", City = "Guadalajara" },
            new() { Name = "Puebla Angelópolis", City = "Puebla" },
        };

        var catalog = new Dictionary<string, (string Name, decimal Price)[]>
        {
            ["Electrónica"] =
            [
                ("Audífonos Bluetooth", 899), ("Bocina portátil", 1299), ("Cargador rápido 30W", 449),
                ("Smartwatch deportivo", 2499), ("Teclado mecánico", 1599), ("Mouse inalámbrico", 399),
                ("Monitor 27\"", 5499), ("Webcam HD", 799),
            ],
            ["Hogar"] =
            [
                ("Cafetera de goteo", 1199), ("Licuadora", 999), ("Juego de sartenes", 1499),
                ("Lámpara LED de escritorio", 549), ("Aspiradora de mano", 1899), ("Juego de toallas", 499),
            ],
            ["Oficina"] =
            [
                ("Silla ergonómica", 3899), ("Escritorio ajustable", 6999), ("Paquete de cuadernos", 189),
                ("Organizador de escritorio", 259), ("Calculadora científica", 349),
            ],
            ["Deportes"] =
            [
                ("Tapete de yoga", 449), ("Mancuernas 5kg (par)", 699), ("Botella térmica", 299),
                ("Balón de fútbol", 399), ("Cuerda para saltar", 149), ("Mochila deportiva", 799),
            ],
            ["Papelería"] =
            [
                ("Plumas gel (12)", 129), ("Marcadores (24)", 219), ("Hojas blancas (500)", 159),
                ("Carpeta de argollas", 99), ("Notas adhesivas", 79),
            ],
        };

        var categories = new List<Category>();
        var products = new List<Product>();
        var skuCounter = 1000;

        foreach (var (categoryName, items) in catalog)
        {
            var category = new Category { Name = categoryName };
            categories.Add(category);

            foreach (var (name, price) in items)
            {
                var minStock = _rng.Next(5, 20);
                products.Add(new Product
                {
                    Sku = $"SKU-{skuCounter++}",
                    Name = name,
                    Price = price,
                    Cost = Math.Round(price * (decimal)(0.45 + _rng.NextDouble() * 0.2), 2),
                    MinStock = minStock,
                    // ~20% de productos quedan con stock bajo para que la alerta tenga algo que mostrar
                    Stock = _rng.NextDouble() < 0.2 ? _rng.Next(0, minStock) : _rng.Next(minStock + 1, 250),
                    Category = category,
                });
            }
        }

        string[] firstNames = ["Ana", "Luis", "María", "Carlos", "Sofía", "Jorge", "Fernanda", "Diego", "Valeria", "Miguel", "Daniela", "Ricardo", "Paola", "Andrés", "Lucía"];
        string[] lastNames = ["García", "Hernández", "López", "Martínez", "González", "Pérez", "Rodríguez", "Sánchez", "Ramírez", "Torres"];

        var customers = Enumerable.Range(1, 80).Select(i =>
        {
            var first = firstNames[_rng.Next(firstNames.Length)];
            var last = lastNames[_rng.Next(lastNames.Length)];
            return new Customer
            {
                Name = $"{first} {last}",
                Email = $"{first}.{last}.{i}@ejemplo.com".ToLowerInvariant(),
            };
        }).ToList();

        // Pesos para que las sucursales no vendan igual (se ve más real en las gráficas)
        double[] branchWeights = [0.38, 0.27, 0.22, 0.13];

        var sales = new List<Sale>();
        var today = DateTime.UtcNow.Date;
        var start = today.AddMonths(-12);

        for (var day = start; day <= today; day = day.AddDays(1))
        {
            // Tendencia de crecimiento + temporada alta en noviembre/diciembre + más ventas en fin de semana
            var growth = 1 + (day - start).TotalDays / 365.0 * 0.35;
            var season = day.Month is 11 or 12 ? 1.4 : day.Month is 1 or 2 ? 0.85 : 1.0;
            var weekend = day.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday ? 1.3 : 1.0;
            var salesToday = (int)Math.Round(6 * growth * season * weekend + _rng.Next(-2, 3));

            for (var s = 0; s < salesToday; s++)
            {
                var sale = new Sale
                {
                    Date = day.AddMinutes(_rng.Next(9 * 60, 21 * 60)),
                    Branch = PickWeighted(branches, branchWeights),
                    Customer = customers[_rng.Next(customers.Count)],
                };

                var lines = _rng.Next(1, 5);
                foreach (var product in products.OrderBy(_ => _rng.Next()).Take(lines))
                    sale.AddItem(product, _rng.Next(1, 4));

                sales.Add(sale);
            }
        }

        // Las navegaciones (Branch, Product...) ya enlazan todo; EF inserta en el orden correcto.
        db.Branches.AddRange(branches);
        db.Categories.AddRange(categories);
        db.Products.AddRange(products);
        db.Customers.AddRange(customers);
        db.Sales.AddRange(sales);

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Datos sembrados: {Sales} ventas, {Products} productos.", sales.Count, products.Count);
    }

    private T PickWeighted<T>(IReadOnlyList<T> items, double[] weights)
    {
        var roll = _rng.NextDouble();
        var cumulative = 0.0;
        for (var i = 0; i < items.Count; i++)
        {
            cumulative += weights[i];
            if (roll < cumulative) return items[i];
        }
        return items[^1];
    }
}
