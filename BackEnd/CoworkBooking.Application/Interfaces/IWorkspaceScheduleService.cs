using CoworkBooking.Application.DTOs;

namespace CoworkBooking.Application.Interfaces
{
    public interface IWorkspaceScheduleService
    {
        Task<WorkspaceSchedulePeriodDto> AddOrReplaceSchedulePeriodAsync(int workspaceId, WorkspaceSchedulePeriodDto periodDto);
        Task<WorkspaceSchedulePeriodDto?> GetActiveSchedulePeriodAsync(int workspaceId, DateTime today);
    }
}
