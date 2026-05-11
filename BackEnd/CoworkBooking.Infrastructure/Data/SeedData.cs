using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Infrastructure.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext context)
        {
            // 🧱 Check if data already exists
            if (context.Workspaces.Any() || context.Rooms.Any() || context.WorkspaceSchedules.Any())
                return;

            // 🏢 Workspace

            var owner = context.Users.FirstOrDefault(u => u.Email == "owner@cowork.com");
            if (owner == null)
            {
                throw new Exception("❌ No owner user found in AspNetUsers table. Please seed Identity first.");
            }

            var workspace = new WorkSpace
            {
                Name = "Downtown Cowork Space",
                Description = "Cozy workspace in Cairo Downtown with modern amenities.",
                Address = "123 Tahrir Street",
                City = "Cairo",
                OwnerId = owner.Id // 👈 هنا المفتاح
            };


            // 🏠 Rooms
            var room1 = new Room
            {
                Name = "Meeting Room A",
                Capacity = 6,
                PricePerHour = 75m,
                WorkSpace = workspace
            };

            var room2 = new Room
            {
                Name = "Private Office B",
                Capacity = 2,
                PricePerHour = 120m,
                WorkSpace = workspace
            };

            // ⚙️ Devices
            var devices = new List<Device>
            {
                new Device { Name = "Projector", ExtraCostPerHour = 20m, Room = room1 },
                new Device { Name = "Whiteboard", ExtraCostPerHour = 10m, Room = room1 },
                new Device { Name = "Monitor", ExtraCostPerHour = 15m, Room = room2 }
            };

            // 🗓️ Schedule Period for current year
            var currentYear = DateTime.Now.Year;
            var schedulePeriod = new WorkspaceSchedulePeriod
            {
                Workspace = workspace,
                StartDate = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(currentYear, 12, 31, 23, 59, 59, DateTimeKind.Utc)
            };

            // 🕒 Weekly Schedule (Sun–Thu: 9–18)
            var schedules = new List<WorkspaceSchedule>
            {
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Sunday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(18, 0, 0), IsWeekend = false },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Monday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(18, 0, 0), IsWeekend = false },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Tuesday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(18, 0, 0), IsWeekend = false },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Wednesday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(18, 0, 0), IsWeekend = false },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Thursday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(18, 0, 0), IsWeekend = false },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Friday, IsWeekend = true },
                new WorkspaceSchedule { SchedulePeriod = schedulePeriod, DayOfWeek = DayOfWeek.Saturday, IsWeekend = true }
            };

            // 📅 Example Bookings — use the actual first user's Guid
            var bookings = new List<Booking>
            {
                new Booking
                {
                    UserId = owner.Id, // actual Guid from Identity
                    Room = room1,
                    StartTime = DateTime.UtcNow.AddHours(1),
                    EndTime = DateTime.UtcNow.AddHours(3),
                    TotalPrice = 150m,
                    Status = BookingStatus.Confirmed
                }
            };

            // 💾 Save data
            context.Workspaces.Add(workspace);
            context.Rooms.AddRange(room1, room2);
            context.Devices.AddRange(devices);
            context.WorkspaceSchedulePeriods.Add(schedulePeriod);
            context.WorkspaceSchedules.AddRange(schedules);
            context.Bookings.AddRange(bookings);

            context.SaveChanges();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("✅ SeedData completed successfully.");
            Console.ResetColor();
        }
    }
}
