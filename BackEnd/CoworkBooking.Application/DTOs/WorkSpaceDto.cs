using System.Collections.Generic;

namespace CoworkBooking.Application.DTOs
{
 public class WorkSpaceDto
 {
 public int Id { get; set; }
 public string? Name { get; set; }
 public string? Description { get; set; }
 public string? Address { get; set; }
 public string? City { get; set; }
 public double? Latitude { get; set; }
 public double? Longitude { get; set; }
 public List<RoomDto>? Rooms { get; set; }
 }
}
