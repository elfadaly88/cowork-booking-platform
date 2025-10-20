using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoworkBooking.Domain.Entities
{
    public class Device
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal ExtraCostPerHour { get; set; }
        public int RoomId { get; set; }
        public Room Room { get; set; }=null!;
    }
}
