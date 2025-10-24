using CoworkBooking.Infrastructure;
using CoworkBooking.Infrastructure.Data;
using CoworkBooking.Domain.Interfaces;
using CoworkBooking.Application.Services;
using CoworkBooking.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;

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

// ✅ Add Services
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Prevent JSON serializer from throwing on cyclical references produced by EF navigation properties
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
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

// Register application services
builder.Services.AddScoped<CoworkBooking.Domain.Interfaces.IRoomService, CoworkBooking.Application.Services.RoomService>();
builder.Services.AddScoped<CoworkBooking.Application.Interfaces.IWorkSpaceService, CoworkBooking.Application.Services.WorkSpaceService>();
builder.Services.AddScoped<CoworkBooking.Application.Interfaces.IDeviceService, CoworkBooking.Application.Services.DeviceService>();
builder.Services.AddScoped<CoworkBooking.Application.Interfaces.IBookingService, CoworkBooking.Application.Services.BookingService>();

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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); 
    SeedData.Initialize(db);     
}

app.Run();

