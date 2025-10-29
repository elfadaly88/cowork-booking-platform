using System;

namespace CoworkBooking.Domain.Entities
{
    public class WorkspaceSchedule
    {
        public int Id { get; set; }
        public int SchedulePeriodId { get; set; }
        public WorkspaceSchedulePeriod SchedulePeriod { get; set; } = null!;

        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan? OpenTime { get; set; }
        public TimeSpan? CloseTime { get; set; }
        public bool IsWeekend { get; set; }
    }
}
