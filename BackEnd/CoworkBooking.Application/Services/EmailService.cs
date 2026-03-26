using CoworkBooking.Application.Interfaces;
using CoworkBooking.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace CoworkBooking.Application.Services
{
    public class EmailSettings
    {
        public string Host      { get; set; } = "smtp.gmail.com";
        public int    Port      { get; set; } = 587;
        public bool   EnableSsl { get; set; } = true;
        public string Username  { get; set; } = string.Empty;
        public string Password  { get; set; } = string.Empty;
        public string FromName  { get; set; } = "CoworkHub";
        public string FromEmail { get; set; } = "noreply@coworkhub.app";
        public bool   IsEnabled { get; set; } = false; // false → log only, no real send
    }

    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
        {
            _settings = settings.Value;
            _logger   = logger;
        }

        public async Task SendBookingConfirmationAsync(string toEmail, string userName, BookingEmailData data)
        {
            var subject = $"✅ Booking Confirmed — {data.WorkspaceName}";
            var body = BuildBookingHtml(userName, data, confirmed: true);
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendBookingCancellationAsync(string toEmail, string userName, BookingEmailData data)
        {
            var subject = $"❌ Booking Cancelled — {data.WorkspaceName}";
            var body = BuildBookingHtml(userName, data, confirmed: false);
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendOwnerReservationNotificationAsync(string toEmail, string ownerName, BookingEmailData data, string guestName, BookingStatus bookingStatus, PaymentStatus paymentStatus)
        {
            var bookingStatusText = bookingStatus.ToString();
            var paymentStatusText = paymentStatus.ToString();
            var subject = $"🔔 New Reservation #{data.BookingId} ({bookingStatusText}/{paymentStatusText})";
            var body = $@"
            <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;'>
              <div style='background:linear-gradient(135deg,#0F172A,#1E293B);padding:2rem;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:1.5rem;'>🏢 CoworkHub Owner Alert</h1>
              </div>
              <div style='padding:2rem;'>
                <h2 style='margin:0 0 0.75rem 0;'>Hi {ownerName},</h2>
                <p style='color:#334155;'>A user has made a reservation in your workspace. Please review the details below.</p>
                <div style='background:#F8FAFC;border-radius:10px;padding:1.2rem;margin:1rem 0;'>
                  <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Booking #</td><td style='font-weight:700;'>#{data.BookingId}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Guest</td><td style='font-weight:700;'>{guestName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Workspace</td><td style='font-weight:700;'>{data.WorkspaceName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Room</td><td style='font-weight:700;'>{data.RoomName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Start</td><td style='font-weight:700;'>{data.StartTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>End</td><td style='font-weight:700;'>{data.EndTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Total</td><td style='font-weight:700;'>EGP {data.TotalPrice:0.00}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Reservation Status</td><td style='font-weight:700;'>{bookingStatusText}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Payment Status</td><td style='font-weight:700;'>{paymentStatusText}</td></tr>
                  </table>
                </div>
                <p style='margin:0;color:#64748B;'>Open your owner dashboard to take action if needed.</p>
              </div>
            </div>";
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendCashReservationApprovedAsync(string toEmail, string userName, BookingEmailData data)
        {
            var subject = $"✅ Cash Reservation Approved — {data.WorkspaceName}";
            var body = $@"
            <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;'>
              <div style='background:linear-gradient(135deg,#14532D,#15803D);padding:2rem;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:1.5rem;'>✅ Reservation Approved</h1>
              </div>
              <div style='padding:2rem;'>
                <h2 style='margin:0 0 0.75rem 0;'>Hi {userName},</h2>
                <p style='color:#334155;'>Great news. The owner approved your cash reservation.</p>
                <div style='background:#F8FAFC;border-radius:10px;padding:1.2rem;margin:1rem 0;'>
                  <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Booking #</td><td style='font-weight:700;'>#{data.BookingId}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Workspace</td><td style='font-weight:700;'>{data.WorkspaceName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Room</td><td style='font-weight:700;'>{data.RoomName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Start</td><td style='font-weight:700;'>{data.StartTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>End</td><td style='font-weight:700;'>{data.EndTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Total</td><td style='font-weight:700;'>EGP {data.TotalPrice:0.00}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Payment Method</td><td style='font-weight:700;'>Cash</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Reservation Status</td><td style='font-weight:700;'>Confirmed</td></tr>
                  </table>
                </div>
                <a href='http://localhost:4200/my-bookings'
                   style='display:inline-block;background:linear-gradient(135deg,#14532D,#15803D);color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;'>
                  View My Bookings →
                </a>
              </div>
            </div>";
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendBookingRejectionAsync(string toEmail, string userName, BookingEmailData data, string? reason = null)
        {
            var subject = $"❌ Reservation Rejected — {data.WorkspaceName}";
            var reasonHtml = string.IsNullOrEmpty(reason)
                ? "<p style='color:#64748B;font-style:italic;'>No reason provided.</p>"
                : $"<p style='color:#64748B;'><strong>Reason:</strong> {reason}</p>";

            var body = $@"
            <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;'>
              <div style='background:linear-gradient(135deg,#7F1D1D,#DC2626);padding:2rem;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:1.5rem;'>❌ Reservation Rejected</h1>
              </div>
              <div style='padding:2rem;'>
                <h2 style='margin:0 0 0.75rem 0;'>Hi {userName},</h2>
                <p style='color:#334155;'>Unfortunately, the workspace owner has rejected your reservation. Please feel free to browse other available spaces or contact support for assistance.</p>
                <div style='background:#FEF2F2;border-radius:10px;padding:1.2rem;margin:1rem 0;border-left:4px solid #DC2626;'>
                  <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Booking #</td><td style='font-weight:700;'>#{data.BookingId}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Workspace</td><td style='font-weight:700;'>{data.WorkspaceName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Room</td><td style='font-weight:700;'>{data.RoomName}</td></tr>
                    <tr><td style='padding:0.4rem 0;color:#64748B;'>Scheduled</td><td style='font-weight:700;'>{data.StartTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                  </table>
                </div>
                <div style='background:#F8FAFC;border-radius:10px;padding:1.2rem;margin:1rem 0;'>
                  <p style='margin:0 0 0.5rem 0;color:#475569;'><strong>Reason for Rejection:</strong></p>
                  {reasonHtml}
                </div>
                <a href='http://localhost:4200/workspaces'
                   style='display:inline-block;background:linear-gradient(135deg,#3B82F6,#2563EB);color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;'>
                  Browse Other Workspaces →
                </a>
              </div>
              <div style='background:#F8FAFC;padding:1rem;text-align:center;border-top:1px solid #E2E8F0;'>
                <p style='margin:0;font-size:0.85rem;color:#64748B;'>If you have any questions, contact support at support@coworkhub.com</p>
              </div>
            </div>";
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName)
        {
            var subject = "🎉 Welcome to CoworkHub!";
            var body = $@"
            <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;'>
              <div style='background:linear-gradient(135deg,#2563EB,#7C3AED);padding:2rem;text-align:center;'>
                <h1 style='color:white;margin:0;'>🏢 CoworkHub</h1>
              </div>
              <div style='padding:2rem;'>
                <h2>Welcome aboard, {userName}!</h2>
                <p>You're now part of CoworkHub. Discover and book amazing workspaces near you.</p>
                <a href='http://localhost:4200/workspaces'
                   style='display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;margin-top:1rem;'>
                  Browse Workspaces →
                </a>
              </div>
            </div>";
            await SendAsync(toEmail, subject, body);
        }

        private string BuildBookingHtml(string userName, BookingEmailData data, bool confirmed)
        {
            var accent     = confirmed ? "#059669" : "#DC2626";
            var statusText = confirmed ? "Confirmed" : "Cancelled";
            var icon       = confirmed ? "✅" : "❌";
            var duration   = (data.EndTime - data.StartTime).TotalHours;

            return $@"
            <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;'>
              <div style='background:linear-gradient(135deg,#2563EB,#7C3AED);padding:2rem;text-align:center;'>
                <h1 style='color:white;margin:0;font-size:1.5rem;'>🏢 CoworkHub</h1>
              </div>
              <div style='padding:2rem;'>
                <div style='text-align:center;margin-bottom:1.5rem;'>
                  <span style='font-size:3rem;'>{icon}</span>
                  <h2 style='color:{accent};margin:0.5rem 0;'>Booking {statusText}</h2>
                  <p style='color:#64748B;'>Hi {userName}, your booking has been {statusText.ToLower()}.</p>
                </div>
                <div style='background:#F8FAFC;border-radius:10px;padding:1.5rem;margin-bottom:1.5rem;'>
                  <table style='width:100%;border-collapse:collapse;'>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Booking #</td><td style='font-weight:700;'>#{data.BookingId}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Workspace</td><td style='font-weight:700;'>{data.WorkspaceName}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Room</td><td style='font-weight:700;'>{data.RoomName}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>City</td><td style='font-weight:700;'>{data.City}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Start</td><td style='font-weight:700;'>{data.StartTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>End</td><td style='font-weight:700;'>{data.EndTime:ddd, MMM d yyyy h:mm tt}</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Duration</td><td style='font-weight:700;'>{duration:0.#} hours</td></tr>
                    <tr><td style='padding:0.5rem 0;color:#64748B;'>Total</td><td style='font-weight:700;color:{accent};'>${data.TotalPrice:0.00}</td></tr>
                    {(data.CancellationReason != null ? $"<tr><td style='padding:0.5rem 0;color:#64748B;'>Reason</td><td style='color:#DC2626;'>{data.CancellationReason}</td></tr>" : "")}
                  </table>
                </div>
                <a href='http://localhost:4200/my-bookings'
                   style='display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;'>
                  View My Bookings →
                </a>
                <p style='margin-top:2rem;color:#94A3B8;font-size:0.8rem;'>CoworkHub · Flexible Workspaces</p>
              </div>
            </div>";
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            if (!_settings.IsEnabled)
            {
                _logger.LogInformation("[EMAIL SIMULATED] To: {To} | Subject: {Subject}", toEmail, subject);
                await Task.CompletedTask;
                return;
            }

            try
            {
                using var client = new SmtpClient(_settings.Host, _settings.Port)
                {
                    EnableSsl   = _settings.EnableSsl,
                    Credentials = new NetworkCredential(_settings.Username, _settings.Password)
                };

                var from    = new MailAddress(_settings.FromEmail, _settings.FromName);
                var to      = new MailAddress(toEmail);
                var message = new MailMessage(from, to)
                {
                    Subject    = subject,
                    Body       = htmlBody,
                    IsBodyHtml = true
                };

                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                // Don't throw — email failure should never break the main flow
            }
        }
    }
}
