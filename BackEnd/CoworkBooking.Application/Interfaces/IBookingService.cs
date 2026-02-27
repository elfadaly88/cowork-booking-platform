using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
    public interface IBookingService
    {
        Task<IEnumerable<BookingDto>> GetAllAsync();
        Task<BookingDto?> GetByIdAsync(int id);
        Task<IEnumerable<BookingDto>> GetByUserAsync(string userId);
        Task<BookingDto> CreateAsync(BookingDto dto);
        Task UpdateAsync(BookingDto dto);
        Task DeleteAsync(int id);
        Task<bool> CancelAsync(int bookingId, string userId, string? reason = null);
        Task<bool> HasConflictAsync(int roomId, DateTime startTime, DateTime endTime, int? excludeBookingId = null);
    }
}

