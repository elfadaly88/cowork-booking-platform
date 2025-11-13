using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace CoworkBooking.Domain.Entities.Auth
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FullName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = true; // Auto-approved for User role, requires admin approval for Owner role
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ApplicationUserRole> UserRoles { get; set; } = new List<ApplicationUserRole>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

        // Reverse navigation property
        public ICollection<WorkSpace> OwnedWorkspaces { get; set; } = new List<WorkSpace>();
    }
}
