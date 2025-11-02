using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace CoworkBooking.Domain.Entities.Auth
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;        
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<WorkSpace> OwnedWorkspaces { get; set; } = new List<WorkSpace>();
    }
}
