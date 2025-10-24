using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using CoworkBooking.Application.Mappings;
using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CoworkBooking.Application.Services
{
 public class WorkSpaceService : IWorkSpaceService
 {
 private readonly AppDbContext _context;

 public WorkSpaceService(AppDbContext context)
 {
 _context = context;
 }

 public async Task<IEnumerable<WorkSpaceDto>> GetAllAsync()
 {
 var entities = await _context.Workspaces.Include(w => w.Rooms).ToListAsync();
 return entities.Select(e => new WorkSpaceDto
 {
 Id = e.Id,
 Name = e.Name,
 Description = e.Description,
 Address = e.Address,
 City = e.City
 });
 }

 public async Task<WorkSpaceDto?> GetByIdAsync(int id)
 {
 var e = await _context.Workspaces.Include(w => w.Rooms).FirstOrDefaultAsync(w => w.Id == id);
 if (e == null) return null;
 return new WorkSpaceDto { Id = e.Id, Name = e.Name, Description = e.Description, Address = e.Address, City = e.City };
 }

 public async Task<WorkSpaceDto> CreateAsync(WorkSpaceDto dto)
 {
 var entity = new WorkSpace { Name = dto.Name ?? string.Empty, Description = dto.Description ?? string.Empty, Address = dto.Address ?? string.Empty, City = dto.City ?? string.Empty };
 _context.Workspaces.Add(entity);
 await _context.SaveChangesAsync();
 dto.Id = entity.Id;
 return dto;
 }

 public async Task UpdateAsync(WorkSpaceDto dto)
 {
 var entity = new WorkSpace { Id = dto.Id, Name = dto.Name ?? string.Empty, Description = dto.Description ?? string.Empty, Address = dto.Address ?? string.Empty, City = dto.City ?? string.Empty };
 _context.Entry(entity).State = EntityState.Modified;
 await _context.SaveChangesAsync();
 }

 public async Task DeleteAsync(int id)
 {
 var entity = await _context.Workspaces.FindAsync(id);
 if (entity != null)
 {
 _context.Workspaces.Remove(entity);
 await _context.SaveChangesAsync();
 }
 }
 }
}
