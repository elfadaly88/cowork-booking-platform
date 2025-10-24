using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CoworkBooking.Application.Services
{
 public class BookingService : IBookingService
 {
 private readonly AppDbContext _context;

 public BookingService(AppDbContext context)
 {
 _context = context;
 }

 public async Task<IEnumerable<BookingDto>> GetAllAsync()
 {
 var entities = await _context.Bookings.ToListAsync();
 return entities.Select(e => new BookingDto { Id = e.Id, UserId = e.UserId, RoomId = e.RoomId, StartTime = e.StartTime, EndTime = e.EndTime, TotalPrice = e.TotalPrice });
 }

 public async Task<BookingDto?> GetByIdAsync(int id)
 {
 var e = await _context.Bookings.FindAsync(id);
 if (e == null) return null;
 return new BookingDto { Id = e.Id, UserId = e.UserId, RoomId = e.RoomId, StartTime = e.StartTime, EndTime = e.EndTime, TotalPrice = e.TotalPrice };
 }

 public async Task<BookingDto> CreateAsync(BookingDto dto)
 {
 var entity = new Booking { UserId = dto.UserId ?? string.Empty, RoomId = dto.RoomId, StartTime = dto.StartTime, EndTime = dto.EndTime, TotalPrice = dto.TotalPrice, Room = null };
 _context.Bookings.Add(entity);
 await _context.SaveChangesAsync();
 dto.Id = entity.Id;
 return dto;
 }

 public async Task UpdateAsync(BookingDto dto)
 {
 var entity = new Booking { Id = dto.Id, UserId = dto.UserId ?? string.Empty, RoomId = dto.RoomId, StartTime = dto.StartTime, EndTime = dto.EndTime, TotalPrice = dto.TotalPrice, Room = null };
 _context.Entry(entity).State = EntityState.Modified;
 await _context.SaveChangesAsync();
 }

 public async Task DeleteAsync(int id)
 {
 var entity = await _context.Bookings.FindAsync(id);
 if (entity != null)
 {
 _context.Bookings.Remove(entity);
 await _context.SaveChangesAsync();
 }
 }
 }
}
