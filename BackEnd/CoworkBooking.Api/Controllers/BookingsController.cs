using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _service;

        public BookingsController(IBookingService service)
        {
            _service = service;
        }

        // ─── GET: api/bookings (Admin only) ─────────────────────────────
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

        // ─── GET: api/bookings/my-bookings ──────────────────────────────
        [HttpGet("my-bookings")]
        [Authorize]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var bookings = await _service.GetByUserAsync(userId);
            return Ok(bookings);
        }

        // ─── GET: api/bookings/{id} ──────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var b = await _service.GetByIdAsync(id);
            if (b == null) return NotFound();

            // Owner check: user can only see their own booking (admin can see all)
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && b.UserId?.ToString() != userId)
                return Forbid();

            return Ok(b);
        }

        // ─── POST: api/bookings ──────────────────────────────────────────
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] BookingDto dto)
        {
            if (dto == null) return BadRequest();

            // Always use the authenticated user's ID — never from the request body
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!Guid.TryParse(userId, out var userGuid))
                return Unauthorized();

            dto.UserId = userGuid;

            try
            {
                var created = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // ─── PATCH: api/bookings/{id}/cancel ────────────────────────────
        [HttpPatch("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> Cancel(int id, [FromBody] CancelBookingDto? dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _service.CancelAsync(id, userId, dto?.CancellationReason);
            if (!success)
                return BadRequest(new { message = "Unable to cancel booking. It may not exist, already be cancelled, or belong to a different user." });

            return Ok(new { message = "Booking cancelled successfully" });
        }

        // ─── POST: api/bookings/{id}/pay ────────────────────────────────
        [HttpPost("{id}/pay")]
        [Authorize]
        public async Task<IActionResult> ProcessPayment(int id, [FromBody] PaymentRequest request)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (existing.UserId?.ToString() != userId && !User.IsInRole("Admin"))
                return Forbid();

            var success = await _service.ProcessPaymentAsync(id, request.PaymentMethodId);
            if (!success) return BadRequest(new { message = "Invalid payment method or booking not found" });

            return Ok(new { message = "Payment updated successfully" });
        }

        // ─── PUT: api/bookings/{id} (Admin or booking owner) ────────────
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] BookingDto dto)
        {
            if (dto == null || id != dto.Id) return BadRequest();

            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && existing.UserId?.ToString() != userId)
                return Forbid();

            await _service.UpdateAsync(dto);
            return NoContent();
        }

        // ─── DELETE: api/bookings/{id} (Admin only) ──────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }

    public class PaymentRequest
    {
        public int PaymentMethodId { get; set; }
    }
}
