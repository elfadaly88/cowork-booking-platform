using System.ComponentModel.DataAnnotations;

namespace CoworkBooking.Application.DTOs
{
    public class UpdateDeviceDto
    {
        public int? Id { get; set; } // Null for new devices

        [Required]
        [MinLength(2, ErrorMessage = "Device name must be at least 2 characters")]
        public string Name { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Extra cost must be greater than or equal to 0")]
        public decimal ExtraCostPerHour { get; set; }
    }
}
