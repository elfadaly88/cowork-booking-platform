using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
 public interface IWorkSpaceService
 {
 Task<IEnumerable<WorkSpaceDto>> GetAllAsync();
        Task<IEnumerable<WorkSpaceDto>> GetAvailableWorkspacesAsync(DateTime? at = null, double? latitude = null, double? longitude = null);
 Task<IEnumerable<WorkSpaceDto>> GetWorkspacesByOwnerAsync(Guid ownerId);
 Task<IEnumerable<WorkSpaceDto>> GetPendingWorkspacesAsync();
 Task<WorkSpaceDto?> GetByIdAsync(int id);
 Task<WorkSpaceDto> CreateAsync(WorkSpaceDto dto);
 Task<WorkSpaceDto> CreateWithRoomsAsync(CreateWorkSpaceDto dto);
 Task UpdateAsync(WorkSpaceDto dto);
 Task<WorkSpaceDto> UpdateWithRoomsAsync(UpdateWorkSpaceDto dto);
 Task<bool> ApproveWorkspaceAsync(int workspaceId);
 Task DeleteAsync(int id);
 }
}
