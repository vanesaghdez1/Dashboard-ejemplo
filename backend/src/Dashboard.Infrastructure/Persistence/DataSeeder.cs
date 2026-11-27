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
            new() { Email = "gerente@ventasmx.demo", FullName = "Gabriel Garza", Role = UserRole.Manager, BranchId = monterrey.Id },
            new() { Email = "vendedor@ventasmx.demo", FullName = "Valeria Vega", Role = UserRole.Seller, BranchId = cdmx.Id },
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
            new() { Name = "CDMX Centro", City = "Mexico City" },
            new() { Name = "Monterrey Valle", City = "Monterrey" },
            new() { Name = "Guadalajara Chapultepec", City = "Guadalajara" },
            new() { Name = "Puebla Angelópolis", City = "Puebla" },
        };

        var catalog = new Dictionary<string, (string Name, decimal Price)[]>
        {
            ["Electronics"] =
            [
                ("Bluetooth Headphones", 899), ("Portable Speaker", 1299), ("30W Fast Charger", 449),
                ("Sports Smartwatch", 2499), ("Mechanical Keyboard", 1599), ("Wireless Mouse", 399),
                ("27\" Monitor", 5499), ("HD Webcam", 799),
            ],
            ["Home"] =
            [
                ("Drip Coffee Maker", 1199), ("Blender", 999), ("Frying Pan Set", 1499),
                ("LED Desk Lamp", 549), ("Handheld Vacuum", 1899), ("Towel Set", 499),
            ],
            ["Office"] =
            [
                ("Ergonomic Chair", 3899), ("Standing Desk", 6999), ("Notebook Pack", 189),
                ("Desk Organizer", 259), ("Scientific Calculator", 349),
            ],
            ["Sports"] =
            [
                ("Yoga Mat", 449), ("5 kg Dumbbells (pair)", 699), ("Insulated Bottle", 299),
                ("Soccer Ball", 399), ("Jump Rope", 149), ("Sports Backpack", 799),
            ],
            ["Stationery"] =
            [
                ("Gel Pens (12)", 129), ("Markers (24)", 219), ("Printer Paper (500)", 159),
                ("Ring Binder", 99), ("Sticky Notes", 79),
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
                Email = $"{first}.{last}.{i}@example.com".ToLowerInvariant(),
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
