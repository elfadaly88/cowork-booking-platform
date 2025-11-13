using CoworkBooking.Application.Interfaces;
using CoworkBooking.Application.Services;
using CoworkBooking.Domain.Entities.Auth;
using CoworkBooking.Domain.Interfaces;
using CoworkBooking.Infrastructure;
using CoworkBooking.Infrastructure.Configuration;
using CoworkBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ==========================
// 🔌 Database Configuration
// ==========================
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
catch (Exception)
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("⚠️ SQL Server unavailable — switching to InMemory DB");
    Console.ResetColor();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("CoworkBooking_Fallback"));
}

// ==========================
// 🔐 Identity Configuration
// ==========================
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ==========================
// 🔑 JWT Authentication
// ==========================
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
    };
});

// ==========================
// 🌍 CORS Configuration
// ==========================
var angularDevOrigins = new[] { "http://localhost:4200", "https://localhost:4200" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(angularDevOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ==========================
// 🧩 Application Services
// ==========================
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IWorkSpaceService, WorkSpaceService>();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IWorkspaceScheduleService, WorkspaceScheduleService>();

builder.Services.AddScoped<JwtService>(); // ✅ مهم لتوليد التوكنات

// ==========================
// 📦 Controllers & JSON
// ==========================
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();

// ==========================
// 📘 Swagger
// ==========================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CoworkBooking API",
        Version = "v1",
        Description = "API documentation for Cowork Booking Platform"
    });

    // Add JWT Auth support in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter JWT token like: Bearer {your token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ==========================
// 🧠 Database Migration & Seed
// ==========================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

    try
    {
        context.Database.Migrate(); // create / update schema
    }
    catch
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Database migration skipped (InMemory or failed).");
        Console.ResetColor();
    }

    await IdentitySeed.SeedAsync(userManager, roleManager); // create default users/roles
    SeedData.Initialize(context); // seed workspace data
}

// ==========================
// 🚀 Middleware Pipeline
// ==========================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngularDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
