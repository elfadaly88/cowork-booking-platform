using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CoworkBooking.Application.Services
{
 public class DeviceService : IDeviceService
 {
 private readonly AppDbContext _context;

 public DeviceService(AppDbContext context)
 {
 _context = context;
 }

 public async Task<IEnumerable<DeviceDto>> GetAllAsync()
 {
 var entities = await _context.Devices.ToListAsync();
 return entities.Select(e => new DeviceDto { Id = e.Id, Name = e.Name, ExtraCostPerHour = e.ExtraCostPerHour, RoomId = e.RoomId });
 }

 public async Task<DeviceDto?> GetByIdAsync(int id)
 {
 var e = await _context.Devices.FindAsync(id);
 if (e == null) return null;
 return new DeviceDto { Id = e.Id, Name = e.Name, ExtraCostPerHour = e.ExtraCostPerHour, RoomId = e.RoomId };
 }

 public async Task<DeviceDto> CreateAsync(DeviceDto dto)
 {
 var entity = new Device { Name = dto.Name ?? string.Empty, ExtraCostPerHour = dto.ExtraCostPerHour, RoomId = dto.RoomId };
 _context.Devices.Add(entity);
 await _context.SaveChangesAsync();
 dto.Id = entity.Id;
 return dto;
 }

 public async Task UpdateAsync(DeviceDto dto)
 {
 var entity = new Device { Id = dto.Id, Name = dto.Name ?? string.Empty, ExtraCostPerHour = dto.ExtraCostPerHour, RoomId = dto.RoomId };
 _context.Entry(entity).State = EntityState.Modified;
 await _context.SaveChangesAsync();
 }

 public async Task DeleteAsync(int id)
 {
 var entity = await _context.Devices.FindAsync(id);
 if (entity != null)
 {
 _context.Devices.Remove(entity);
 await _context.SaveChangesAsync();
 }
 }
 }
}
