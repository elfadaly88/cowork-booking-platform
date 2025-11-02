using System;
using Microsoft.AspNetCore.Identity;

namespace CoworkBooking.Domain.Entities.Auth
{
    public class ApplicationRole : IdentityRole
    {
        public string? Description { get; set; }
        public string? PermissionsJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
