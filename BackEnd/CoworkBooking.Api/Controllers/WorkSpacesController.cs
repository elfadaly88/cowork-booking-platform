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

        // ✅ POST: api/workspaces
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WorkSpaceDto workspace)
        {
            if (workspace == null) return BadRequest();
            var created = await _service.CreateAsync(workspace);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // ✅ PUT: api/workspaces/5
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
