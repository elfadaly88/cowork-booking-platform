using CoworkBooking.Domain.Entities;
using CoworkBooking.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var rooms = await _roomService.GetAllRoomsAsync();
            return Ok(rooms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);

            if (room == null)
                return NotFound();

            return Ok(room);
        }

        // POST: api/rooms
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Room room)
        {
            if (room == null)
                return BadRequest();

            var created = await _roomService.CreateRoomAsync(room);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/rooms/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Room room)
        {
            if (room == null || id != room.Id)
                return BadRequest();

            var existing = await _roomService.GetRoomByIdAsync(id);
            if (existing == null)
                return NotFound();

            await _roomService.UpdateRoomAsync(room);
            return NoContent();
        }

        // DELETE: api/rooms/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _roomService.GetRoomByIdAsync(id);
            if (existing == null)
                return NotFound();

            await _roomService.DeleteRoomAsync(id);
            return NoContent();
        }
    }
}
