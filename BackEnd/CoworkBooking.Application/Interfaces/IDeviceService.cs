using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
 public interface IDeviceService
 {
 Task<IEnumerable<DeviceDto>> GetAllAsync();
 Task<DeviceDto?> GetByIdAsync(int id);
 Task<DeviceDto> CreateAsync(DeviceDto dto);
 Task UpdateAsync(DeviceDto dto);
 Task DeleteAsync(int id);
 }
}
