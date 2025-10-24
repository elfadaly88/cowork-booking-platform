using CoworkBooking.Application.DTOs;
using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Application.Mappings
{
 public static class DtoMapper
 {
 public static RoomDto ToDto(this Room room)
 {
 if (room == null) return null!;
 return new RoomDto
 {
 Id = room.Id,
 Name = room.Name,
 Capacity = room.Capacity,
 HasDevices = room.HasDevices,
 PricePerHour = room.PricePerHour,
 WorkspaceId = room.WorkspaceId,
 WorkSpace = room.WorkSpace == null ? null : new WorkSpaceDto
 {
 Id = room.WorkSpace.Id,
 Name = room.WorkSpace.Name,
 Description = room.WorkSpace.Description,
 Address = room.WorkSpace.Address,
 City = room.WorkSpace.City
 },
 Devices = room.Devices?.Select(d => new DeviceDto
 {
 Id = d.Id,
 Name = d.Name,
 ExtraCostPerHour = d.ExtraCostPerHour,
 RoomId = d.RoomId
 }).ToList()
 };
 }

 public static Room ToEntity(this RoomDto dto)
 {
 if (dto == null) return null!;
 return new Room
 {
 Id = dto.Id,
 Name = dto.Name,
 Capacity = dto.Capacity,
 HasDevices = dto.HasDevices,
 PricePerHour = dto.PricePerHour,
 WorkspaceId = dto.WorkspaceId
 };
 }
 }
}
