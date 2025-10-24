namespace CoworkBooking.Application.DTOs
{
 public class BookingDto
 {
 public int Id { get; set; }
 public string? UserId { get; set; }
 public int RoomId { get; set; }
 public DateTime StartTime { get; set; }
 public DateTime EndTime { get; set; }
 public decimal TotalPrice { get; set; }
 }
}
