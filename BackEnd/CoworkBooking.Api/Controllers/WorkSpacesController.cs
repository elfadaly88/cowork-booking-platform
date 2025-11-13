using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkSpacesController : ControllerBase
    {
        private readonly IWorkSpaceService _service;
        private readonly IWorkspaceScheduleService _scheduleService;

        public WorkSpacesController(IWorkSpaceService service, IWorkspaceScheduleService scheduleService)
        {
            _service = service;
            _scheduleService = scheduleService;
        }

        // ✅ GET: api/workspaces
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var workspaces = await _service.GetAllAsync();
            return Ok(workspaces);
        }

        // ✅ GET: api/workspaces/available (for regular users - only approved workspaces)
        [HttpGet("available")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailable()
        {
            var available = await _service.GetAvailableWorkspacesAsync();
            return Ok(available);
        }

        // ✅ GET: api/workspaces/pending (for admin - get workspaces waiting for approval)
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingWorkspaces()
        {
            var pending = await _service.GetPendingWorkspacesAsync();
            return Ok(pending);
        }

        // ✅ GET: api/workspaces/my-workspaces (for owners - get their own workspaces)
        [HttpGet("my-workspaces")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetMyWorkspaces()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var workspaces = await _service.GetWorkspacesByOwnerAsync(Guid.Parse(userId));
            return Ok(workspaces);
        }

        // ✅ GET: api/workspaces/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var workspace = await _service.GetByIdAsync(id);
            if (workspace == null)
                return NotFound();

            return Ok(workspace);
        }

        // ✅ POST: api/workspaces (Simple - without rooms)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] WorkSpaceDto workspace)
        {
            if (workspace == null) return BadRequest();
            var created = await _service.CreateAsync(workspace);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // ✅ POST: api/workspaces/with-rooms (Complete - with rooms and devices)
        [HttpPost("with-rooms")]
        [Authorize(Roles = "Admin,Owner")]
        public async Task<IActionResult> CreateWithRooms([FromBody] CreateWorkSpaceDto workspace)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // If owner, set the OwnerId from the authenticated user
                if (User.IsInRole("Owner"))
                {
                    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        workspace.OwnerId = Guid.Parse(userId);
                    }
                }

                var created = await _service.CreateWithRoomsAsync(workspace);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ PUT: api/workspaces/5 (Simple - workspace only)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] WorkSpaceDto workspace)
        {
            if (workspace == null || id != workspace.Id)
                return BadRequest();

            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            await _service.UpdateAsync(workspace);
            return NoContent();
        }

        // ✅ PUT: api/workspaces/5/with-rooms (Complete - with rooms and devices)
        [HttpPut("{id}/with-rooms")]
        [Authorize(Roles = "Admin,Owner")]
        public async Task<IActionResult> UpdateWithRooms(int id, [FromBody] UpdateWorkSpaceDto workspace)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != workspace.Id)
                return BadRequest(new { message = "ID mismatch" });

            try
            {
                // If owner, validate they own this workspace
                if (User.IsInRole("Owner"))
                {
                    var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        var existingWorkspace = await _service.GetByIdAsync(id);
                        if (existingWorkspace == null)
                            return NotFound(new { message = "Workspace not found" });

                        // Check if the workspace belongs to this owner
                        var ownerWorkspaces = await _service.GetWorkspacesByOwnerAsync(Guid.Parse(userId));
                        if (!ownerWorkspaces.Any(w => w.Id == id))
                            return Forbid(); // User doesn't own this workspace
                    }
                }

                var updated = await _service.UpdateWithRoomsAsync(workspace);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ GET: api/workspaces/{id}/schedule (active period)
        [HttpGet("{id}/schedule")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveSchedule(int id)
        {
            var period = await _scheduleService.GetActiveSchedulePeriodAsync(id, DateTime.UtcNow);
            if (period == null) return NotFound();
            return Ok(period);
        }

        // ✅ POST: api/workspaces/{id}/schedule (add or replace period)
        [HttpPost("{id}/schedule")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddOrReplaceSchedule(int id, [FromBody] WorkspaceSchedulePeriodDto dto)
        {
            if (dto == null) return BadRequest();
            var saved = await _scheduleService.AddOrReplaceSchedulePeriodAsync(id, dto);
            return Ok(saved);
        }

        // ✅ POST: api/workspaces/{id}/approve (admin approves a workspace)
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveWorkspace(int id)
        {
            var success = await _service.ApproveWorkspaceAsync(id);
            if (!success)
                return NotFound(new { message = "Workspace not found" });

            return Ok(new { message = "Workspace approved successfully" });
        }

        // ✅ DELETE: api/workspaces/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Owner")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // If owner, validate they own this workspace
            if (User.IsInRole("Owner"))
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var ownerWorkspaces = await _service.GetWorkspacesByOwnerAsync(Guid.Parse(userId));
                    if (!ownerWorkspaces.Any(w => w.Id == id))
                        return Forbid(); // User doesn't own this workspace
                }
            }

            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
