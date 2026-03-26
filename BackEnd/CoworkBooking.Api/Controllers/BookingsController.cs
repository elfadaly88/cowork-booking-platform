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

        // ─── GET: api/bookings/workspace-bookings ───────────────────────
        [HttpGet("workspace-bookings")]
        [Authorize]
        public async Task<IActionResult> GetWorkspaceBookings()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var bookings = await _service.GetByWorkspaceOwnerAsync(userId);
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

        // ─── GET: api/bookings/check-availability ─────────────────────────
        // Returns whether a room is free for the requested window.
        // Requires authentication so anonymous callers cannot probe the schedule.
        [HttpGet("check-availability")]
        [Authorize]
        public async Task<IActionResult> CheckAvailability(
            [FromQuery] int roomId,
            [FromQuery] DateTime startTime,
            [FromQuery] DateTime endTime)
        {
            if (roomId <= 0)
                return BadRequest(new { available = false, message = "Invalid room ID." });

            if (startTime >= endTime)
                return BadRequest(new { available = false, message = "End time must be after start time." });

            var hasConflict = await _service.HasConflictAsync(roomId, startTime, endTime);
            return Ok(new
            {
                available = !hasConflict,
                message = hasConflict
                    ? "This room is already fully booked for the selected time slot."
                    : "Time slot is available."
            });
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
                // Room is fully booked for the requested slot.
                return Conflict(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                // End time before start, or start time in the past.
                return BadRequest(new { message = ex.Message });
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

        // ─── POST: api/bookings/{id}/approve-cash ─────────────────────
        [HttpPost("{id}/approve-cash")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> ApproveCashReservation(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _service.ApproveCashBookingAsync(id, userId, User.IsInRole("Admin"));
            if (!success)
                return BadRequest(new { message = "Unable to approve cash reservation. It may not be pending, not cash, or not owned by you." });

            return Ok(new { message = "Cash reservation approved and user notified successfully" });
        }

        // ─── POST: api/bookings/{id}/reject ───────────────────────────
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> RejectReservation(int id, [FromBody] RejectBookingDto? dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _service.RejectBookingAsync(id, userId, User.IsInRole("Admin"), dto?.Reason);
            if (!success)
                return BadRequest(new { message = "Unable to reject reservation. It may not exist, already be rejected, or not owned by you." });

            return Ok(new { message = "Reservation rejected and user notified successfully" });
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

            try
            {
                await _service.UpdateAsync(dto);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

    public class RejectBookingDto
    {
        public string? Reason { get; set; }
    }
}
