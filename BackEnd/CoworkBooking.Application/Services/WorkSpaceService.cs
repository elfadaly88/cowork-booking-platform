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
 var entities = await _context.Workspaces
     .Include(w => w.Rooms)
     .ThenInclude(r => r.Devices)
     .ToListAsync();

 return entities.Select(e => new WorkSpaceDto
 {
 Id = e.Id,
 Name = e.Name,
 Description = e.Description,
 Address = e.Address,
 City = e.City,
 Latitude = e.Latitude,
 Longitude = e.Longitude,
 Rooms = e.Rooms.Select(r => new RoomDto
 {
     Id = r.Id,
     Name = r.Name,
     Capacity = r.Capacity,
     PricePerHour = r.PricePerHour,
     HasDevices = r.Devices.Any(),
     WorkspaceId = r.WorkspaceId,
     Devices = r.Devices.Select(d => new DeviceDto
     {
         Id = d.Id,
         Name = d.Name,
         ExtraCostPerHour = d.ExtraCostPerHour,
         RoomId = d.RoomId
     }).ToList()
 }).ToList()
 });
 }

 public async Task<WorkSpaceDto?> GetByIdAsync(int id)
 {
 var e = await _context.Workspaces
     .Include(w => w.Rooms)
     .ThenInclude(r => r.Devices)
     .FirstOrDefaultAsync(w => w.Id == id);

 if (e == null) return null;

 return new WorkSpaceDto
 {
 Id = e.Id,
 Name = e.Name,
 Description = e.Description,
 Address = e.Address,
 City = e.City,
 Latitude = e.Latitude,
 Longitude = e.Longitude,
 Rooms = e.Rooms.Select(r => new RoomDto
 {
     Id = r.Id,
     Name = r.Name,
     Capacity = r.Capacity,
     PricePerHour = r.PricePerHour,
     HasDevices = r.Devices.Any(),
     WorkspaceId = r.WorkspaceId,
     Devices = r.Devices.Select(d => new DeviceDto
     {
         Id = d.Id,
         Name = d.Name,
         ExtraCostPerHour = d.ExtraCostPerHour,
         RoomId = d.RoomId
     }).ToList()
 }).ToList()
 };
 }

 public async Task<WorkSpaceDto> CreateAsync(WorkSpaceDto dto)
 {
 var entity = new WorkSpace
 {
 Name = dto.Name ?? string.Empty,
 Description = dto.Description ?? string.Empty,
 Address = dto.Address ?? string.Empty,
 City = dto.City ?? string.Empty,
 Latitude = dto.Latitude,
 Longitude = dto.Longitude
 };

 _context.Workspaces.Add(entity);
 await _context.SaveChangesAsync();
 dto.Id = entity.Id;
 return dto;
 }

 public async Task<WorkSpaceDto> CreateWithRoomsAsync(CreateWorkSpaceDto dto)
 {
 var entity = new WorkSpace
 {
 Name = dto.Name,
 Description = dto.Description,
 Address = dto.Address,
 City = dto.City,
 Latitude = dto.Latitude,
 Longitude = dto.Longitude
 };

 // Add rooms if provided
 if (dto.Rooms != null && dto.Rooms.Any())
 {
 foreach (var roomDto in dto.Rooms)
 {
     var room = new Room
     {
         Name = roomDto.Name,
         Capacity = roomDto.Capacity,
         PricePerHour = roomDto.PricePerHour,
         HasDevices = roomDto.Devices != null && roomDto.Devices.Any()
     };

     // Add devices if provided
     if (roomDto.Devices != null && roomDto.Devices.Any())
     {
         foreach (var deviceDto in roomDto.Devices)
         {
             room.Devices.Add(new Device
             {
                 Name = deviceDto.Name,
                 ExtraCostPerHour = deviceDto.ExtraCostPerHour
             });
         }
     }

     entity.Rooms.Add(room);
 }
 }

 _context.Workspaces.Add(entity);
 await _context.SaveChangesAsync();

 // Return the created workspace with all related data
 return await GetByIdAsync(entity.Id) ?? new WorkSpaceDto { Id = entity.Id };
 }

 public async Task UpdateAsync(WorkSpaceDto dto)
 {
 var entity = await _context.Workspaces.FindAsync(dto.Id);
 if (entity == null) return;

 entity.Name = dto.Name ?? string.Empty;
 entity.Description = dto.Description ?? string.Empty;
 entity.Address = dto.Address ?? string.Empty;
 entity.City = dto.City ?? string.Empty;
 entity.Latitude = dto.Latitude;
 entity.Longitude = dto.Longitude;

 await _context.SaveChangesAsync();
 }

 public async Task<WorkSpaceDto> UpdateWithRoomsAsync(UpdateWorkSpaceDto dto)
 {
 var entity = await _context.Workspaces
     .Include(w => w.Rooms)
     .ThenInclude(r => r.Devices)
     .FirstOrDefaultAsync(w => w.Id == dto.Id);

 if (entity == null)
     throw new KeyNotFoundException($"Workspace with ID {dto.Id} not found");

 // Update workspace properties
 entity.Name = dto.Name;
 entity.Description = dto.Description;
 entity.Address = dto.Address;
 entity.City = dto.City;
 entity.Latitude = dto.Latitude;
 entity.Longitude = dto.Longitude;

 // Handle rooms update
 if (dto.Rooms != null)
 {
 // Get IDs of rooms to keep
 var roomIdsToKeep = dto.Rooms.Where(r => r.Id.HasValue).Select(r => r.Id!.Value).ToList();

 // Remove rooms that are not in the update list
 var roomsToRemove = entity.Rooms.Where(r => !roomIdsToKeep.Contains(r.Id)).ToList();
 foreach (var room in roomsToRemove)
 {
     _context.Rooms.Remove(room);
 }

 // Update or add rooms
 foreach (var roomDto in dto.Rooms)
 {
     if (roomDto.Id.HasValue)
     {
         // Update existing room
         var existingRoom = entity.Rooms.FirstOrDefault(r => r.Id == roomDto.Id.Value);
         if (existingRoom != null)
         {
             existingRoom.Name = roomDto.Name;
             existingRoom.Capacity = roomDto.Capacity;
             existingRoom.PricePerHour = roomDto.PricePerHour;
             existingRoom.HasDevices = roomDto.Devices != null && roomDto.Devices.Any();

             // Handle devices update
             if (roomDto.Devices != null)
             {
                 var deviceIdsToKeep = roomDto.Devices.Where(d => d.Id.HasValue).Select(d => d.Id!.Value).ToList();
                 var devicesToRemove = existingRoom.Devices.Where(d => !deviceIdsToKeep.Contains(d.Id)).ToList();

                 foreach (var device in devicesToRemove)
                 {
                     _context.Devices.Remove(device);
                 }

                 foreach (var deviceDto in roomDto.Devices)
                 {
                     if (deviceDto.Id.HasValue)
                     {
                         var existingDevice = existingRoom.Devices.FirstOrDefault(d => d.Id == deviceDto.Id.Value);
                         if (existingDevice != null)
                         {
                             existingDevice.Name = deviceDto.Name;
                             existingDevice.ExtraCostPerHour = deviceDto.ExtraCostPerHour;
                         }
                     }
                     else
                     {
                         existingRoom.Devices.Add(new Device
                         {
                             Name = deviceDto.Name,
                             ExtraCostPerHour = deviceDto.ExtraCostPerHour
                         });
                     }
                 }
             }
         }
     }
     else
     {
         // Add new room
         var newRoom = new Room
         {
             Name = roomDto.Name,
             Capacity = roomDto.Capacity,
             PricePerHour = roomDto.PricePerHour,
             HasDevices = roomDto.Devices != null && roomDto.Devices.Any(),
             WorkspaceId = entity.Id
         };

         if (roomDto.Devices != null)
         {
             foreach (var deviceDto in roomDto.Devices)
             {
                 newRoom.Devices.Add(new Device
                 {
                     Name = deviceDto.Name,
                     ExtraCostPerHour = deviceDto.ExtraCostPerHour
                 });
             }
         }

         entity.Rooms.Add(newRoom);
     }
 }
 }

 await _context.SaveChangesAsync();

 // Return updated workspace with all related data
 return await GetByIdAsync(entity.Id) ?? new WorkSpaceDto { Id = entity.Id };
 }

 public async Task DeleteAsync(int id)
 {
 var entity = await _context.Workspaces
     .Include(w => w.Rooms)
     .ThenInclude(r => r.Devices)
     .FirstOrDefaultAsync(w => w.Id == id);

 if (entity != null)
 {
 _context.Workspaces.Remove(entity);
 await _context.SaveChangesAsync();
 }
 }
 }
}
