using System;
using System.Collections.Generic;

namespace CoworkBooking.Application.DTOs
{
    public class WorkSpaceDto
    {
        public int Id { get; set; }
        public Guid? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsApproved { get; set; }
        public double? AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public double? Distance { get; set; }
        public List<RoomDto>? Rooms { get; set; }
        public List<WorkspaceImageDto>? Images { get; set; }

        /// <summary>Convenience: URL of the main/cover image</summary>
        public string? MainImageUrl => Images?.FirstOrDefault(i => i.IsMain)?.Url
                                    ?? Images?.OrderBy(i => i.Order).FirstOrDefault()?.Url;
    }

    public class WorkspaceImageDto
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public bool IsMain { get; set; }
        public int Order { get; set; }
    }
}

