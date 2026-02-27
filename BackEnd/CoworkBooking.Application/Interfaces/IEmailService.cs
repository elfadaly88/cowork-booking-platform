namespace CoworkBooking.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendBookingConfirmationAsync(string toEmail, string userName, BookingEmailData data);
        Task SendBookingCancellationAsync(string toEmail, string userName, BookingEmailData data);
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
