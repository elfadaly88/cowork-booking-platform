using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Infrastructure.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext context)
        {
            // ✅ لو فيه داتا خلاص
            if (context.Workspaces.Any())
                return;

            // 🏢 إنشاء Workspace
            var workspace = new WorkSpace
            {
                Name = "Downtown Cowork Space",
                Description = "Cozy workspace in Cairo Downtown with modern amenities.",
                Address = "123 Tahrir Street",
                City = "Cairo"
            };

            // 🏠 إنشاء الغرف
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

            // ⚙️ إنشاء الأجهزة
            var devices = new List<Device>
            {
                new Device { Name = "Projector", ExtraCostPerHour = 20m, Room = room1 },
                new Device { Name = "Whiteboard", ExtraCostPerHour = 10m, Room = room1 },
                new Device { Name = "Monitor", ExtraCostPerHour = 15m, Room = room2 }
            };

            // 📅 إنشاء حجوزات تجريبية
            var bookings = new List<Booking>
            {
                new Booking
                {
                    UserId = "test-user-1",
                    Room = room1,
                    StartTime = DateTime.Now.AddHours(1),
                    EndTime = DateTime.Now.AddHours(3),
                    TotalPrice = 150m
                },
                new Booking
                {
                    UserId = "test-user-2",
                    Room = room2,
                    StartTime = DateTime.Now.AddDays(1).AddHours(9),
                    EndTime = DateTime.Now.AddDays(1).AddHours(12),
                    TotalPrice = 360m
                }
            };

            // 💾 حفظ البيانات
            context.Workspaces.Add(workspace);
            context.Rooms.AddRange(room1, room2);
            context.Devices.AddRange(devices);
            context.Bookings.AddRange(bookings);

            context.SaveChanges();
        }
    }
}
