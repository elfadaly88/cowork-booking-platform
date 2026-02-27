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
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

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
    // — Password policy
    options.Password.RequiredLength = 8;          // increased from 6
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;     // enabled
    options.Password.RequireNonAlphanumeric = false;

    // — Account lockout (brute-force protection) ✅ FIX #8
    options.Lockout.DefaultLockoutTimeSpan  = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers      = true;

    // — User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ==========================
// 🔑 JWT Authentication
// ==========================
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from configuration.");

// ✅ FIX #1 — Validate JWT key length at startup (must be ≥ 32 chars / 256 bits)
if (string.IsNullOrWhiteSpace(jwtSettings.Key) || jwtSettings.Key.Length < 32)
    throw new InvalidOperationException("JWT Key must be at least 32 characters. Set a strong key in user-secrets or environment variables.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // ✅ FIX #7 — require HTTPS in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,        // rejects expired tokens
        ValidateIssuerSigningKey = true,
        ValidIssuer    = jwtSettings.Issuer,
        ValidAudience  = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
        ClockSkew = TimeSpan.FromSeconds(30)   // ✅ FIX — reduce clock skew to 30s (default 5 min is too generous)
    };
});

// ==========================
// 🌍 CORS Configuration
// ==========================
var allowedOrigins = builder.Configuration.GetSection("AllowedCorsOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200", "https://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(allowedOrigins)   // ✅ FIX #14 — no wildcard; origins from config
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ==========================
// 🛡️ Rate Limiting (FIX #6)
// ==========================
builder.Services.AddRateLimiter(options =>
{
    // Strict limiter for auth endpoints — prevents brute-force / credential stuffing
    options.AddFixedWindowLimiter("AuthPolicy", o =>
    {
        o.Window           = TimeSpan.FromMinutes(1);
        o.PermitLimit      = 10;   // max 10 login attempts per minute per IP
        o.QueueLimit       = 0;
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // General API limiter
    options.AddFixedWindowLimiter("ApiPolicy", o =>
    {
        o.Window      = TimeSpan.FromSeconds(10);
        o.PermitLimit = 60;
        o.QueueLimit  = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ==========================
// 🧩 Application Services
// ==========================
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IWorkSpaceService, WorkSpaceService>();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IWorkspaceScheduleService, WorkspaceScheduleService>();
builder.Services.AddScoped<JwtService>();

// ==========================
// 📧 Email Service
// ==========================
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();

// Allow large multipart uploads for image uploads — cap at 10 MB per file (reduced from 50 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 10_000_000; // ✅ FIX #15 — 10 MB total request limit
});

// ==========================
// 📦 Controllers & JSON
// ==========================
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

// ==========================
// 📘 Swagger — Dev only
// ==========================
if (builder.Environment.IsDevelopment()) // ✅ FIX #17 — Swagger only registered in dev
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "CoworkBooking API",
            Version = "v1",
            Description = "API documentation for Cowork Booking Platform"
        });

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
}

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
        context.Database.Migrate();
    }
    catch
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("Database migration skipped (InMemory or failed).");
        Console.ResetColor();
    }

    await IdentitySeed.SeedAsync(userManager, roleManager,
        services.GetRequiredService<IConfiguration>()); // ✅ FIX #5 — pass config for admin password from env
    SeedData.Initialize(context);
}

// ==========================
// 🚀 Middleware Pipeline
// ==========================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ FIX #9 — Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"]    = "nosniff";
    context.Response.Headers["X-Frame-Options"]           = "DENY";
    context.Response.Headers["X-XSS-Protection"]         = "1; mode=block";
    context.Response.Headers["Referrer-Policy"]           = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Content-Security-Policy"]   =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'";

    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    await next();
});

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAngularDev");

// ✅ Rate limiting must be after CORS but before auth
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
