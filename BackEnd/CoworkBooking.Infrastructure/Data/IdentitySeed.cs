using CoworkBooking.Domain.Entities.Auth;
using Microsoft.AspNetCore.Identity;
using System.Text.Json;

namespace CoworkBooking.Infrastructure.Data
{
    public static class IdentitySeed
    {

        public static async Task SeedAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
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
                if (!await roleManager.RoleExistsAsync(role.Name))
                    await roleManager.CreateAsync(role);
            }

            // Create admin user if not exists
            var adminEmail = "admin@cowork.com";
            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FullName = "Super Admin"
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }
    }
}
