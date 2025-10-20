using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoworkBooking.Domain.Entities
{
    public class Room
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public bool HasDevices { get; set; }
        public decimal PricePerHour { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace WorkSpace { get; set; } = null!;
        public ICollection<Device> Devices { get; set; } = new List<Device>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();


    }
}
