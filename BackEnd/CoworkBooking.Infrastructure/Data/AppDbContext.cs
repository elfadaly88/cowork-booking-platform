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
        public DbSet<WorkspaceImage> WorkspaceImages { get; set; }
        public DbSet<WorkspaceReview> WorkspaceReviews { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

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

            modelBuilder.Entity<Booking>()
                .Property(b => b.TotalPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.PaymentMethod)
                .WithMany()
                .HasForeignKey(b => b.PaymentMethodId)
                .OnDelete(DeleteBehavior.SetNull);

            // Default Payment Methods Seeding
            modelBuilder.Entity<PaymentMethod>().HasData(
                new PaymentMethod { Id = 1, Name = "Cash", Description = "Pay with cash on arrival", IsActive = true },
                new PaymentMethod { Id = 2, Name = "Credit Card", Description = "Pay securely using your credit or debit card", IsActive = true },
                new PaymentMethod { Id = 3, Name = "Vodafone Cash", Description = "Pay with your Vodafone Cash wallet", IsActive = true }
            );

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

            // Booking → ApplicationUser (use NoAction to avoid cascade conflicts)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // WorkspaceImage cascades with WorkSpace
            modelBuilder.Entity<WorkspaceImage>()
                .HasOne(i => i.WorkSpace)
                .WithMany(w => w.Images)
                .HasForeignKey(i => i.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            // WorkspaceReview cascade + no-action for user delete
            modelBuilder.Entity<WorkspaceReview>()
                .HasOne(r => r.WorkSpace)
                .WithMany()
                .HasForeignKey(r => r.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkspaceReview>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Unique: one review per user per workspace
            modelBuilder.Entity<WorkspaceReview>()
                .HasIndex(r => new { r.WorkspaceId, r.UserId })
                .IsUnique();

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

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.TokenHash)
                .IsUnique();

            modelBuilder.Entity<RefreshToken>()
                .Property(rt => rt.TokenHash)
                .HasMaxLength(128)
                .IsRequired();

            modelBuilder.Entity<RefreshToken>()
                .Property(rt => rt.ReplacedByTokenHash)
                .HasMaxLength(128);

            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

