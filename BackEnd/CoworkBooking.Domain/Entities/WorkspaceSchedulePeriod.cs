using System;
using System.Collections.Generic;

namespace CoworkBooking.Domain.Entities
{
    public class WorkspaceSchedulePeriod
    {
        public int Id { get; set; }
        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public ICollection<WorkspaceSchedule> Schedules { get; set; } = new List<WorkspaceSchedule>();
    }
}
