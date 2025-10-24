using CoworkBooking.Domain.Entities;
using CoworkBooking.Domain.Interfaces;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CoworkBooking.Application.Services
{
 public class RoomService : IRoomService
 {
 private readonly AppDbContext _context;

 public RoomService(AppDbContext context)
 {
 _context = context;
 }

 public async Task<IEnumerable<Room>> GetAllRoomsAsync()
 {
 return await _context.Rooms
 .Include(r => r.WorkSpace)
 .Include(r => r.Devices)
 .ToListAsync();
 }

 public async Task<Room?> GetRoomByIdAsync(int id)
 {
 return await _context.Rooms
 .Include(r => r.WorkSpace)
 .Include(r => r.Devices)
 .FirstOrDefaultAsync(r => r.Id == id);
 }

 public async Task<Room> CreateRoomAsync(Room room)
 {
 _context.Rooms.Add(room);
 await _context.SaveChangesAsync();
 return room;
 }

 public async Task UpdateRoomAsync(Room room)
 {
 _context.Entry(room).State = EntityState.Modified;
 await _context.SaveChangesAsync();
 }

 public async Task DeleteRoomAsync(int id)
 {
 var room = await _context.Rooms.FindAsync(id);
 if (room != null)
 {
 _context.Rooms.Remove(room);
 await _context.SaveChangesAsync();
 }
 }
 }
}
