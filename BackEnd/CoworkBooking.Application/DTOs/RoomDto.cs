using System.Collections.Generic;

namespace CoworkBooking.Application.DTOs
{
 public class RoomDto
 {
 public int Id { get; set; }
 public string? Name { get; set; }
 public int Capacity { get; set; }
 public bool HasDevices { get; set; }
 public decimal PricePerHour { get; set; }
 public int WorkspaceId { get; set; }
 public WorkSpaceDto? WorkSpace { get; set; }
 public List<DeviceDto>? Devices { get; set; }
 }
}
