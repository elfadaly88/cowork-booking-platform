using CoworkBooking.Domain.Entities.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace CoworkBooking.Infrastructure.Data
{
    public static class IdentitySeed
    {
        public static async Task SeedAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IConfiguration? configuration = null)
        {
            var roles = new List<ApplicationRole>
            {
                new ApplicationRole
                {
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    Description = "System administrator",
                    PermissionsJson = JsonSerializer.Serialize(new {
                        canManageUsers = true,
                        canManageWorkspaces = true,
                        canViewReports = true,
                        canBookRooms = true
                    })
                },
                new ApplicationRole
                {
                    Name = "Owner",
                    NormalizedName = "OWNER",
                    Description = "Workspace owner",
                    PermissionsJson = JsonSerializer.Serialize(new {
                        canManageOwnWorkspaces = true,
                        canEditRooms = true,
                        canViewBookings = true
                    })
                },
                new ApplicationRole
                {
                    Name = "User",
                    NormalizedName = "USER",
                    Description = "Regular user",
                    PermissionsJson = JsonSerializer.Serialize(new {
                        canBookRooms = true,
                        canViewWorkspaces = true
                    })
                }
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role.Name!))
                    await roleManager.CreateAsync(role);
            }

            // ✅ FIX #5 — Read admin password from environment variable instead of hardcoding
            var adminEmail = configuration?["AdminSettings:Email"] ?? "admin@cowork.com";
            var adminPassword = Environment.GetEnvironmentVariable("ADMIN_SEED_PASSWORD")
                             ?? configuration?["AdminSettings:DefaultPassword"];

            if (string.IsNullOrWhiteSpace(adminPassword))
            {
                // In development, fall back to a known dev-only password but warn loudly
                // In production this MUST be overridden via env variable
                adminPassword = "DevAdmin@2025!";
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\u26a0\ufe0f  WARNING: ADMIN_SEED_PASSWORD env var not set. Using default DEV password.");
                Console.WriteLine("         Set ADMIN_SEED_PASSWORD in production!");
                Console.ResetColor();
            }

            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName       = adminEmail,
                    Email          = adminEmail,
                    EmailConfirmed = true,
                    FullName       = "Super Admin",
                    LockoutEnabled = false, // admin account cannot be locked out
                    IsActive       = true,
                    IsApproved     = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("\u2705  Admin user seeded successfully.");
                    Console.ResetColor();
                }
                else
                {
                    var errs = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"\u274c  Failed to seed admin: {errs}");
                    Console.ResetColor();
                }
            }
        }
    }
}
