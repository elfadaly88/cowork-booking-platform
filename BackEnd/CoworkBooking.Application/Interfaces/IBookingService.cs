using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
 public interface IBookingService
 {
 Task<IEnumerable<BookingDto>> GetAllAsync();
 Task<BookingDto?> GetByIdAsync(int id);
 Task<BookingDto> CreateAsync(BookingDto dto);
 Task UpdateAsync(BookingDto dto);
 Task DeleteAsync(int id);
 }
}
