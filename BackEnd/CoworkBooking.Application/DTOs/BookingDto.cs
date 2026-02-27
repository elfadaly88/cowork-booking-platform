using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Application.DTOs
{
    public class BookingDto
    {
        public int Id { get; set; }
        public Guid? UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? UserEmail { get; set; }

        public int RoomId { get; set; }
        public string? RoomName { get; set; }
        public string? WorkspaceName { get; set; }
        public string? WorkspaceCity { get; set; }
        public int? WorkspaceId { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalPrice { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CancelBookingDto
    {
        public string? CancellationReason { get; set; }
    }
}

