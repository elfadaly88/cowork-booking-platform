using System.ComponentModel.DataAnnotations;

namespace CoworkBooking.Domain.Entities
{
    public class WorkspaceImage
    {
        public int Id { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace WorkSpace { get; set; } = null!;

        [Required]
        public string Url { get; set; } = string.Empty;

        public string? Caption { get; set; }

        /// <summary>True for the primary/cover image displayed in cards</summary>
        public bool IsMain { get; set; } = false;

        /// <summary>Display order — lower appears first</summary>
        public int Order { get; set; } = 0;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
