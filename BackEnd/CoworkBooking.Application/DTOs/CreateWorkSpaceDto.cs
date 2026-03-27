using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CoworkBooking.Application.DTOs
{
    public class CreateWorkSpaceDto
    {
        [Required]
        [MinLength(3, ErrorMessage = "Name must be at least 3 characters")]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "Latitude is required. Please select the location on the map.")]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public double Latitude { get; set; }

        [Required(ErrorMessage = "Longitude is required. Please select the location on the map.")]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public double Longitude { get; set; }

        public int? ApprovalPaymentMethodId { get; set; }

        public Guid? OwnerId { get; set; } // Set by the system for owners

        public List<CreateRoomDto>? Rooms { get; set; }
    }
}
