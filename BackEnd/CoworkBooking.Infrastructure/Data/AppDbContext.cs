using CoworkBooking.Domain.Entities;
using CoworkBooking.Domain.Entities.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Collections.Generic;

namespace CoworkBooking.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid,
         IdentityUserClaim<Guid>,
        ApplicationUserRole,
        IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>,
        IdentityUserToken<Guid>>
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

            modelBuilder.Entity<WorkSpace>()
                   .HasOne(ws => ws.Owner)
                   .WithMany(u => u.OwnedWorkspaces)
                   .HasForeignKey(ws => ws.OwnerId)
                   .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ApplicationUserRole>(userRole =>
            {
                userRole.HasKey(ur => new { ur.UserId, ur.RoleId });

                userRole.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .IsRequired();

                userRole.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .IsRequired();
            });
        }
    }
}
