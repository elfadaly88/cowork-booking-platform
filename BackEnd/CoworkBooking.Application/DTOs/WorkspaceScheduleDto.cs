using System;
using System.Collections.Generic;

namespace CoworkBooking.Application.DTOs
{
    public class WorkspaceScheduleDto
    {
        public int Id { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan? OpenTime { get; set; }
        public TimeSpan? CloseTime { get; set; }
        public bool IsWeekend { get; set; }
    }

    public class WorkspaceSchedulePeriodDto
    {
        public int Id { get; set; }
        public int WorkspaceId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<WorkspaceScheduleDto> Schedules { get; set; } = new();
    }
}
