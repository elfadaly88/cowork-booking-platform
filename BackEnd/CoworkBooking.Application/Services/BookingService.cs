using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CoworkBooking.Application.Services
{
    public class BookingService : IBookingService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _email;
        private readonly ILogger<BookingService> _logger;

        public BookingService(AppDbContext context, IEmailService email, ILogger<BookingService> logger)
        {
            _context = context;
            _email   = email;
            _logger  = logger;
        }

        // ─── Helper: project entity to DTO ───────────────────────────────
        private static BookingDto MapToDto(Booking e) => new BookingDto
        {
            Id = e.Id,
            UserId = e.UserId,
            UserFullName = e.User?.FullName,
            UserEmail = e.User?.Email,
            RoomId = e.RoomId,
            RoomName = e.Room?.Name,
            WorkspaceId = e.Room?.WorkspaceId,
            WorkspaceName = e.Room?.WorkSpace?.Name,
            WorkspaceCity = e.Room?.WorkSpace?.City,
            StartTime = e.StartTime,
            EndTime = e.EndTime,
            TotalPrice = e.TotalPrice,
            Status = e.Status,
            CancellationReason = e.CancellationReason,
            CancelledAt = e.CancelledAt,
            CreatedAt = e.CreatedAt,
            PaymentMethodId = e.PaymentMethodId,
            PaymentMethodName = e.PaymentMethod?.Name,
            PaymentStatus = e.PaymentStatus
        };

        private IQueryable<Booking> BookingsWithDetails() =>
            _context.Bookings
                .Include(b => b.User)
                .Include(b => b.PaymentMethod)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.WorkSpace)
                        .ThenInclude(w => w!.Owner);

        // ─── Admin: all bookings ─────────────────────────────────────────
        public async Task<IEnumerable<BookingDto>> GetAllAsync()
        {
            var entities = await BookingsWithDetails()
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return entities.Select(MapToDto);
        }

        // ─── Single booking ──────────────────────────────────────────────
        public async Task<BookingDto?> GetByIdAsync(int id)
        {
            var e = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == id);
            return e == null ? null : MapToDto(e);
        }

        // ─── User's own bookings ─────────────────────────────────────────
        public async Task<IEnumerable<BookingDto>> GetByUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return Enumerable.Empty<BookingDto>();

            var entities = await BookingsWithDetails()
                .Where(b => b.UserId == userGuid)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return entities.Select(MapToDto);
        }

        // ─── Owner: all bookings for rooms in owner's workspaces ─────────
        public async Task<IEnumerable<BookingDto>> GetByWorkspaceOwnerAsync(string ownerId)
        {
            if (!Guid.TryParse(ownerId, out var ownerGuid)) return Enumerable.Empty<BookingDto>();

            var entities = await BookingsWithDetails()
                .Where(b => b.Room != null && b.Room.WorkSpace != null && b.Room.WorkSpace.OwnerId == ownerGuid)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return entities.Select(MapToDto);
        }

        // ─── Conflict check ──────────────────────────────────────────────
        public async Task<bool> HasConflictAsync(int roomId, DateTime startTime, DateTime endTime, int? excludeBookingId = null)
        {
            // Get the room's capacity to know how many simultaneous bookings are allowed
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null) return true; // treat missing room as conflict

            var overlappingCount = await _context.Bookings
                .Where(b =>
                    b.RoomId == roomId &&
                    // Approved (confirmed) reservations must always block capacity checks.
                    // Pending reservations also block to avoid overbooking while payment/approval is in progress.
                    b.Status != BookingStatus.Cancelled &&
                    b.StartTime < endTime &&
                    b.EndTime > startTime &&
                    (excludeBookingId == null || b.Id != excludeBookingId))
                .CountAsync();

            return overlappingCount >= room.Capacity;
        }

        // ─── Create ──────────────────────────────────────────────────────
        public async Task<BookingDto> CreateAsync(BookingDto dto)
        {
            if (dto.EndTime <= dto.StartTime)
                throw new ArgumentException("End time must be after start time.");

            // Frontend sends local ISO strings (no Z), so compare against local now.
            // Using DateTime.UtcNow here would compare a local-kind value against a UTC
            // value and produce wrong results for UTC+ timezones.
            if (dto.StartTime < DateTime.Now.AddMinutes(-5))
                throw new ArgumentException("Start time cannot be in the past.");

            // Conflict check before creating
            bool hasConflict = await HasConflictAsync(dto.RoomId, dto.StartTime, dto.EndTime);
            if (hasConflict)
                throw new InvalidOperationException("The selected room is fully booked for the requested time slot.");

            var entity = new Booking
            {
                UserId = dto.UserId ?? Guid.Empty,
                RoomId = dto.RoomId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TotalPrice = dto.TotalPrice,
                Status = BookingStatus.Pending,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(entity);
            await _context.SaveChangesAsync();

            // Reload with details for full DTO
            var created = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == entity.Id);

            return MapToDto(created!);
        }

        // ─── Update ──────────────────────────────────────────────────────
        public async Task UpdateAsync(BookingDto dto)
        {
            if (dto.EndTime <= dto.StartTime)
                throw new ArgumentException("End time must be after start time.");

            var entity = await _context.Bookings.FindAsync(dto.Id);
            if (entity == null) return;

            // Only re-check conflicts when the time window actually changes.
            bool timesChanged = entity.StartTime != dto.StartTime || entity.EndTime != dto.EndTime;
            if (timesChanged)
            {
                bool hasConflict = await HasConflictAsync(dto.RoomId, dto.StartTime, dto.EndTime, excludeBookingId: dto.Id);
                if (hasConflict)
                    throw new InvalidOperationException("The selected room is fully booked for the requested time slot.");
            }

            entity.StartTime = dto.StartTime;
            entity.EndTime = dto.EndTime;
            entity.TotalPrice = dto.TotalPrice;
            entity.Status = dto.Status;
            entity.PaymentStatus = dto.PaymentStatus;
            entity.PaymentMethodId = dto.PaymentMethodId;

            await _context.SaveChangesAsync();
        }

        public async Task<bool> ProcessPaymentAsync(int bookingId, int paymentMethodId)
        {
            var entity = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == bookingId);
            if (entity == null) return false;

            var paymentMethod = await _context.PaymentMethods.FindAsync(paymentMethodId);
            if (paymentMethod == null) return false;

            entity.PaymentMethodId = paymentMethodId;

            // "if user check cash payment the request send to database and be pending"
            if (paymentMethod.Name == "Cash")
            {
                entity.PaymentStatus = PaymentStatus.Pending;
                entity.Status = BookingStatus.Pending;
            }
            else
            {
                // handle other payment methods by simulating success
                entity.PaymentStatus = PaymentStatus.Paid;
                entity.Status = BookingStatus.Confirmed;
            }

            await _context.SaveChangesAsync();

            QueueOwnerReservationEmail(entity);

            if (entity.Status == BookingStatus.Confirmed)
            {
                QueueUserBookingConfirmationEmail(entity);
            }

            return true;
        }

        public async Task<bool> ApproveCashBookingAsync(int bookingId, string approverUserId, bool isAdmin = false)
        {
            if (!Guid.TryParse(approverUserId, out var approverGuid)) return false;

            var entity = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == bookingId);
            if (entity == null) return false;

            var ownerId = entity.Room?.WorkSpace?.OwnerId;
            if (!isAdmin && ownerId != approverGuid) return false;

            if (!string.Equals(entity.PaymentMethod?.Name, "Cash", StringComparison.OrdinalIgnoreCase))
                return false;

            if (entity.Status == BookingStatus.Cancelled) return false;

            entity.Status = BookingStatus.Confirmed;
            await _context.SaveChangesAsync();

            QueueCashApprovedEmail(entity);
            return true;
        }

        public async Task<bool> RejectBookingAsync(int bookingId, string ownerUserId, bool isAdmin = false, string? reason = null)
        {
            if (!Guid.TryParse(ownerUserId, out var ownerGuid)) return false;

            var entity = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == bookingId);
            if (entity == null) return false;

            // Verify owner or admin
            var workspaceOwnerId = entity.Room?.WorkSpace?.OwnerId;
            if (!isAdmin && workspaceOwnerId != ownerGuid) return false;

            // Cannot reject if already cancelled or confirmed
            if (entity.Status != BookingStatus.Pending) return false;

            entity.Status = BookingStatus.Cancelled;
            entity.CancellationReason = reason;
            entity.CancelledAt = DateTime.Now;
            await _context.SaveChangesAsync();

            QueueBookingRejectionEmail(entity, reason);
            return true;
        }

        // ─── Cancel ──────────────────────────────────────────────────────
        public async Task<bool> CancelAsync(int bookingId, string userId, string? reason = null)
        {
            if (!Guid.TryParse(userId, out var userGuid)) return false;

            var entity = await _context.Bookings.FindAsync(bookingId);
            if (entity == null) return false;

            // Only the booking owner (or admin via separate path) can cancel
            if (entity.UserId != userGuid) return false;

            if (entity.Status == BookingStatus.Cancelled) return false; // already cancelled

            entity.Status = BookingStatus.Cancelled;
            entity.CancellationReason = reason;
            entity.CancelledAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send cancellation email
            _ = Task.Run(async () =>
            {
                try
                {
                    var full = await BookingsWithDetails().FirstOrDefaultAsync(b => b.Id == bookingId);
                    if (full?.User?.Email != null)
                    {
                        await _email.SendBookingCancellationAsync(
                            full.User.Email,
                            full.User.FullName,
                            new BookingEmailData(
                                full.Id,
                                full.Room?.WorkSpace?.Name ?? "Workspace",
                                full.Room?.Name ?? "Room",
                                full.Room?.WorkSpace?.City ?? "",
                                full.StartTime,
                                full.EndTime,
                                full.TotalPrice,
                                reason
                            )
                        );
                    }
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Cancellation email failed"); }
            });

            return true;
        }

        // ─── Delete (admin only) ─────────────────────────────────────────
        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Bookings.FindAsync(id);
            if (entity != null)
            {
                _context.Bookings.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        private void QueueOwnerReservationEmail(Booking booking)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var owner = booking.Room?.WorkSpace?.Owner;
                    if (owner?.Email == null) return;

                    await _email.SendOwnerReservationNotificationAsync(
                        owner.Email,
                        owner.FullName,
                        new BookingEmailData(
                            booking.Id,
                            booking.Room?.WorkSpace?.Name ?? "Workspace",
                            booking.Room?.Name ?? "Room",
                            booking.Room?.WorkSpace?.City ?? "",
                            booking.StartTime,
                            booking.EndTime,
                            booking.TotalPrice
                        ),
                        booking.User?.FullName ?? "Guest",
                        booking.Status,
                        booking.PaymentStatus
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Owner reservation email failed");
                }
            });
        }

        private void QueueUserBookingConfirmationEmail(Booking booking)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    if (booking.User?.Email == null) return;

                    await _email.SendBookingConfirmationAsync(
                        booking.User.Email,
                        booking.User.FullName,
                        new BookingEmailData(
                            booking.Id,
                            booking.Room?.WorkSpace?.Name ?? "Workspace",
                            booking.Room?.Name ?? "Room",
                            booking.Room?.WorkSpace?.City ?? "",
                            booking.StartTime,
                            booking.EndTime,
                            booking.TotalPrice
                        )
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Booking confirmation email failed");
                }
            });
        }

        private void QueueCashApprovedEmail(Booking booking)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    if (booking.User?.Email == null) return;

                    await _email.SendCashReservationApprovedAsync(
                        booking.User.Email,
                        booking.User.FullName,
                        new BookingEmailData(
                            booking.Id,
                            booking.Room?.WorkSpace?.Name ?? "Workspace",
                            booking.Room?.Name ?? "Room",
                            booking.Room?.WorkSpace?.City ?? "",
                            booking.StartTime,
                            booking.EndTime,
                            booking.TotalPrice
                        )
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Cash approval email failed");
                }
            });
        }

        private void QueueBookingRejectionEmail(Booking booking, string? reason = null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    if (booking.User?.Email == null) return;

                    await _email.SendBookingRejectionAsync(
                        booking.User.Email,
                        booking.User.FullName,
                        new BookingEmailData(
                            booking.Id,
                            booking.Room?.WorkSpace?.Name ?? "Workspace",
                            booking.Room?.Name ?? "Room",
                            booking.Room?.WorkSpace?.City ?? "",
                            booking.StartTime,
                            booking.EndTime,
                            booking.TotalPrice,
                            reason
                        ),
                        reason
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Booking rejection email failed");
                }
            });
        }
    }
}
