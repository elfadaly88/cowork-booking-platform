using System;
using Microsoft.AspNetCore.Identity;

namespace CoworkBooking.Domain.Entities.Auth
{
    public class ApplicationRole : IdentityRole<Guid>
    {
        public string? Description { get; set; }
        public string? PermissionsJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<ApplicationUserRole> UserRoles { get; set; } = new List<ApplicationUserRole>();

    }
}
