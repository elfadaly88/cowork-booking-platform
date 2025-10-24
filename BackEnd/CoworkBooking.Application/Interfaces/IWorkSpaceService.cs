using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
 public interface IWorkSpaceService
 {
 Task<IEnumerable<WorkSpaceDto>> GetAllAsync();
 Task<WorkSpaceDto?> GetByIdAsync(int id);
 Task<WorkSpaceDto> CreateAsync(WorkSpaceDto dto);
 Task<WorkSpaceDto> CreateWithRoomsAsync(CreateWorkSpaceDto dto);
 Task UpdateAsync(WorkSpaceDto dto);
 Task<WorkSpaceDto> UpdateWithRoomsAsync(UpdateWorkSpaceDto dto);
 Task DeleteAsync(int id);
 }
}
