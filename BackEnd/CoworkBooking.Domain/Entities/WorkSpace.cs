using CoworkBooking.Domain.Entities.Auth;
using System.Collections.Generic;

namespace CoworkBooking.Domain.Entities
{
    public class WorkSpace
    {
        public int Id { get; set; }

        // Changed to string to match ApplicationUser.Id (Identity default)
        public string OwnerId { get; set; } = string.Empty;

        // Navigation property so EF can map the relationship cleanly
        public ApplicationUser? Owner { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public ICollection<Room> Rooms { get; set; } = new List<Room>();
        public ICollection<WorkspaceSchedulePeriod> SchedulePeriods { get; set; } = new List<WorkspaceSchedulePeriod>();
    }
}
