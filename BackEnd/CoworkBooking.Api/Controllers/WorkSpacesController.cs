using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkSpacesController : ControllerBase
    {
        private readonly IWorkSpaceService _service;

        public WorkSpacesController(IWorkSpaceService service)
        {
            _service = service;
        }

        // ✅ GET: api/workspaces
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var workspaces = await _service.GetAllAsync();
            return Ok(workspaces);
        }

        // ✅ GET: api/workspaces/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var workspace = await _service.GetByIdAsync(id);
            if (workspace == null)
                return NotFound();

            return Ok(workspace);
        }

        // ✅ POST: api/workspaces (Simple - without rooms)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WorkSpaceDto workspace)
        {
            if (workspace == null) return BadRequest();
            var created = await _service.CreateAsync(workspace);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // ✅ POST: api/workspaces/with-rooms (Complete - with rooms and devices)
        [HttpPost("with-rooms")]
        public async Task<IActionResult> CreateWithRooms([FromBody] CreateWorkSpaceDto workspace)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
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
        public async Task<IActionResult> UpdateWithRooms(int id, [FromBody] UpdateWorkSpaceDto workspace)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != workspace.Id)
                return BadRequest(new { message = "ID mismatch" });

            try
            {
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

        // ✅ DELETE: api/workspaces/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null) return NotFound();

            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
