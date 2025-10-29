using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CoworkBooking.Application.Services
{
    public class WorkspaceScheduleService : IWorkspaceScheduleService
    {
        private readonly AppDbContext _context;

        public WorkspaceScheduleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WorkspaceSchedulePeriodDto> AddOrReplaceSchedulePeriodAsync(int workspaceId, WorkspaceSchedulePeriodDto dto)
        {
            // Remove overlaps
            var overlaps = await _context.WorkspaceSchedulePeriods
                .Where(p => p.WorkspaceId == workspaceId &&
                            p.StartDate < dto.EndDate &&
                            p.EndDate > dto.StartDate)
                .ToListAsync();
            if (overlaps.Any())
            {
                _context.WorkspaceSchedulePeriods.RemoveRange(overlaps);
            }

            var entity = new WorkspaceSchedulePeriod
            {
                WorkspaceId = workspaceId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate
            };
            foreach (var s in dto.Schedules)
            {
                entity.Schedules.Add(new WorkspaceSchedule
                {
                    DayOfWeek = s.DayOfWeek,
                    OpenTime = s.OpenTime,
                    CloseTime = s.CloseTime,
                    IsWeekend = s.IsWeekend
                });
            }

            _context.WorkspaceSchedulePeriods.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            dto.WorkspaceId = workspaceId;
            dto.Schedules = entity.Schedules.Select(s => new WorkspaceScheduleDto
            {
                Id = s.Id,
                DayOfWeek = s.DayOfWeek,
                OpenTime = s.OpenTime,
                CloseTime = s.CloseTime,
                IsWeekend = s.IsWeekend
            }).ToList();
            return dto;
        }

        public async Task<WorkspaceSchedulePeriodDto?> GetActiveSchedulePeriodAsync(int workspaceId, DateTime today)
        {
            var period = await _context.WorkspaceSchedulePeriods
                .Include(p => p.Schedules)
                .FirstOrDefaultAsync(p => p.WorkspaceId == workspaceId && today >= p.StartDate && today <= p.EndDate);

            if (period == null) return null;

            return new WorkspaceSchedulePeriodDto
            {
                Id = period.Id,
                WorkspaceId = period.WorkspaceId,
                StartDate = period.StartDate,
                EndDate = period.EndDate,
                Schedules = period.Schedules.Select(s => new WorkspaceScheduleDto
                {
                    Id = s.Id,
                    DayOfWeek = s.DayOfWeek,
                    OpenTime = s.OpenTime,
                    CloseTime = s.CloseTime,
                    IsWeekend = s.IsWeekend
                }).ToList()
            };
        }
    }
}
