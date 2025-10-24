using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CoworkBooking.Application.DTOs
{
    public class CreateRoomDto
    {
        [Required]
        [MinLength(2, ErrorMessage = "Room name must be at least 2 characters")]
        public string Name { get; set; } = string.Empty;

        [Range(1, 1000, ErrorMessage = "Capacity must be between 1 and 1000")]
        public int Capacity { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Price must be greater than or equal to 0")]
        public decimal PricePerHour { get; set; }

        public List<CreateDeviceDto>? Devices { get; set; }
    }
}
