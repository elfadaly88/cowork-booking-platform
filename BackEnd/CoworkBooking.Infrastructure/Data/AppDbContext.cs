using CoworkBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Collections.Generic;

namespace CoworkBooking.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<WorkSpace> Workspaces { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Device> Devices { get; set; }
        public DbSet<WorkspaceSchedulePeriod> WorkspaceSchedulePeriods { get; set; }
        public DbSet<WorkspaceSchedule> WorkspaceSchedules { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Room>()
                .Property(r => r.PricePerHour)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Device>()
                .Property(d => d.ExtraCostPerHour)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Booking>()
                .Property(b => b.TotalPrice)
                .HasPrecision(18, 2);

            // Relationships for schedules
            modelBuilder.Entity<WorkspaceSchedulePeriod>()
                .HasOne(p => p.Workspace)
                .WithMany(w => w.SchedulePeriods)
                .HasForeignKey(p => p.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkspaceSchedule>()
                .HasOne(s => s.SchedulePeriod)
                .WithMany(p => p.Schedules)
                .HasForeignKey(s => s.SchedulePeriodId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
