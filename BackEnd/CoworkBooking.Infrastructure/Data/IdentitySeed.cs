using CoworkBooking.Domain.Entities.Auth;
using Microsoft.AspNetCore.Identity;
using System.Text.Json;

namespace CoworkBooking.Infrastructure.Data
{
    public static class IdentitySeed
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {
            // ✅ 1. Create roles if they don't exist
            var roles = new List<ApplicationRole>
            {
                new ApplicationRole
                {
                    Name = "Admin",
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
                    Description = "Workspace owner",
                    PermissionsJson = JsonSerializer.Serialize(new {
                        canManageOwnWorkspaces = true,
                        canEditRooms = true,
                        canViewBookings = true,
                        canBookRooms = false
                    })
                },
                new ApplicationRole
                {
                    Name = "User",
                    Description = "Regular user",
                    PermissionsJson = JsonSerializer.Serialize(new {
                        canBookRooms = true,
                        canViewWorkspaces = true
                    })
                }
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role.Name))
                {
                    await roleManager.CreateAsync(role);
                    Console.WriteLine($"✅ Role '{role.Name}' created.");
                }
            }

            // ✅ 2. Create default users
            var defaultUsers = new List<(string Email, string Password, string Role)>
            {
                ("admin@cowork.com", "Admin@123", "Admin"),
                ("owner@cowork.com", "Owner@123", "Owner"),
                ("user@cowork.com", "User@123", "User")
            };

            foreach (var (email, password, role) in defaultUsers)
            {
                var existingUser = await userManager.FindByEmailAsync(email);
                if (existingUser == null)
                {
                    var newUser = new ApplicationUser
                    {
                        UserName = email,
                        Email = email,
                        EmailConfirmed = true,
                        FullName = role switch
                        {
                            "Admin" => "System Administrator",
                            "Owner" => "Default Workspace Owner",
                            "User" => "Test User",
                            _ => "User"
                        }
                    };

                    var createResult = await userManager.CreateAsync(newUser, password);
                    if (createResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(newUser, role);
                        Console.WriteLine($"👤 User '{email}' created and assigned role '{role}'.");
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Failed to create user '{email}': {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                    }
                }
                else
                {
                    Console.WriteLine($"ℹ️ User '{email}' already exists.");
                }
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("✅ Identity seeding completed successfully.");
            Console.ResetColor();
        }
    }
}
