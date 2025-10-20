using CoworkBooking.Infrastructure;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var useInMemory = builder.Configuration.GetValue<bool>("DatabaseSettings:UseInMemory");


try
{
    if (!useInMemory && !string.IsNullOrEmpty(connectionString))
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("🗄️ Using SQL Server Database");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));
    }
    else
    {
        throw new Exception("Forcing InMemory by config");
    }
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("⚠️ SQL Server unavailable — switching to InMemory DB");
    Console.ResetColor();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("CoworkBooking_Fallback"));
}

//if (useInMemory)
//{
//    Console.WriteLine("💾 Using InMemory Database");
//    builder.Services.AddDbContext<AppDbContext>(options =>
//        options.UseInMemoryDatabase("CoworkBookingDB"));
//}
//else
//{
//    Console.WriteLine("🧱 Using SQL Server Database");
//    builder.Services.AddDbContext<AppDbContext>(options =>
//        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
//}

// ✅ Add Services
builder.Services.AddControllers();  
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CoworkBooking API",
        Version = "v1",
        Description = "API documentation for Cowork Booking Platform"
    });
});


var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    // Create DB if not exists and seed
    context.Database.Migrate();
    SeedData.Initialize(context);
}




// ✅ Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseAuthorization();

// ✅ Enable Swagger permanently
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CoworkBooking API v1");
    c.RoutePrefix = string.Empty; // makes Swagger the homepage
});

// ✅ Map Controllers
app.MapControllers();

app.Run();

