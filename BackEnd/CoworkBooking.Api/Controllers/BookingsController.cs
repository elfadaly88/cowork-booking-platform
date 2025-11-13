using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All booking operations require authentication
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _service;
        public BookingsController(IBookingService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var b = await _service.GetByIdAsync(id);
            if (b == null) return NotFound();
            return Ok(b);
        }

        [HttpPost]
        [Authorize] // Any authenticated user can create bookings
        public async Task<IActionResult> Create([FromBody] BookingDto dto)
        {
            if (dto == null) return BadRequest();
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize] // Users can update their own bookings (add ownership check in service)
        public async Task<IActionResult> Update(int id, [FromBody] BookingDto dto)
        {
            if (dto == null || id != dto.Id) return BadRequest();
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _service.UpdateAsync(dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize] // Users can delete their own bookings (add ownership check in service)
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
