using CoworkBooking.Domain.Entities.Auth;
using System;

namespace CoworkBooking.Domain.Entities
{
    public enum BookingStatus
    {
        Pending = 0,
        Confirmed = 1,
        Cancelled = 2,
        Completed = 3
    }

    public class Booking
    {
        public int Id { get; set; }

        /// <summary>Stored as Guid string for compatibility; matches ApplicationUser.Id (Guid)</summary>
        public Guid UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalPrice { get; set; }

        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public string? CancellationReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Payment Info
        public int? PaymentMethodId { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    }
}

