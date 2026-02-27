using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace CoworkBooking.Domain.Entities.Auth
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName  { get; set; } = string.Empty;
        public string? Phone    { get; set; }

        /// <summary>Computed display name</summary>
        public string FullName
        {
            get => $"{FirstName} {LastName}".Trim();
            set
            {
                // Support legacy FullName assignment (splits on first space)
                var parts = value?.Split(' ', 2) ?? Array.Empty<string>();
                FirstName = parts.Length > 0 ? parts[0] : string.Empty;
                LastName  = parts.Length > 1 ? parts[1] : string.Empty;
            }
        }

        public string? ProfileImageUrl { get; set; }
        public bool IsActive   { get; set; } = true;
        public bool IsApproved { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ApplicationUserRole> UserRoles { get; set; } = new List<ApplicationUserRole>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<WorkSpace> OwnedWorkspaces { get; set; } = new List<WorkSpace>();
    }
}

