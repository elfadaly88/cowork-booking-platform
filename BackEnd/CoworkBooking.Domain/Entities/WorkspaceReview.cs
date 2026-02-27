using CoworkBooking.Domain.Entities.Auth;
using System;
using System.ComponentModel.DataAnnotations;

namespace CoworkBooking.Domain.Entities
{
    /// <summary>User rating and review for a workspace (1–5 stars)</summary>
    public class WorkspaceReview
    {
        public int Id { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace WorkSpace { get; set; } = null!;

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
