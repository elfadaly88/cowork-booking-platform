using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendBookingConfirmationAsync(string toEmail, string userName, BookingEmailData data);
        Task SendBookingCancellationAsync(string toEmail, string userName, BookingEmailData data);
        Task SendOwnerReservationNotificationAsync(string toEmail, string ownerName, BookingEmailData data, string guestName, BookingStatus bookingStatus, PaymentStatus paymentStatus);
        Task SendCashReservationApprovedAsync(string toEmail, string userName, BookingEmailData data);
        Task SendBookingRejectionAsync(string toEmail, string userName, BookingEmailData data, string? reason = null);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
    }

    public record BookingEmailData(
        int BookingId,
        string WorkspaceName,
        string RoomName,
        string City,
        DateTime StartTime,
        DateTime EndTime,
        decimal TotalPrice,
        string? CancellationReason = null
    );
}
