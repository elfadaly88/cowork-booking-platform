// CoworkBooking.Domain/Interfaces/IRoomService.cs
using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Domain.Interfaces
{
    public interface IRoomService
    {
        Task<IEnumerable<Room>> GetAllRoomsAsync();
        Task<Room?> GetRoomByIdAsync(int id);
        Task<Room> CreateRoomAsync(Room room);
        Task UpdateRoomAsync(Room room);
        Task DeleteRoomAsync(int id);
    }
}
