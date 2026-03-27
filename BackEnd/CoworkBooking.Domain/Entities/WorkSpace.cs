using CoworkBooking.Domain.Entities.Auth;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoworkBooking.Domain.Entities
{
    public class WorkSpace
    {
        public int Id { get; set; }

        // OwnerId - foreign key to ApplicationUser
        public Guid? OwnerId { get; set; }

        [ForeignKey(nameof(OwnerId))]
        public ApplicationUser? Owner { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // Approval status - Workspaces created by Owner must be approved by Admin before being visible to users
        public bool IsApproved { get; set; } = false;

        // Owner listing subscription fee (1000 EGP/month) that must be settled before admin approval.
        public decimal MonthlyFeeAmount { get; set; } = 1000m;
        public int? ApprovalPaymentMethodId { get; set; }
        public PaymentMethod? ApprovalPaymentMethod { get; set; }
        public PaymentStatus ApprovalPaymentStatus { get; set; } = PaymentStatus.Pending;
        public DateTime? ApprovalPaymentPaidAt { get; set; }
        public DateTime? SubscriptionStartDate { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }

        // Ratings
        public double? AverageRating { get; set; }
        public int TotalReviews { get; set; } = 0;

        public ICollection<Room> Rooms { get; set; } = new List<Room>();
        public ICollection<WorkspaceSchedulePeriod> SchedulePeriods { get; set; } = new List<WorkspaceSchedulePeriod>();
        public ICollection<WorkspaceImage> Images { get; set; } = new List<WorkspaceImage>();
    }
}
