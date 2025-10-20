using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkSpacesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WorkSpacesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/workspaces
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkSpace>>> GetAll()
        {
            var workspaces = await _context.Workspaces.Include(w => w.Rooms)
        .ThenInclude(r => r.Devices)
    .ToListAsync();

            return Ok(workspaces);
        }

        // ✅ GET: api/workspaces/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkSpace>> GetById(int id)
        {
            var workspace = await _context.Workspaces
                .Include(w => w.Rooms)
                .ThenInclude(r => r.Devices)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workspace == null)
                return NotFound();

            return Ok(workspace);
        }

        // ✅ POST: api/workspaces
        [HttpPost]
        public async Task<ActionResult<WorkSpace>> Create(WorkSpace workspace)
        {
            _context.Workspaces.Add(workspace);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = workspace.Id }, workspace);
        }

        // ✅ PUT: api/workspaces/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, WorkSpace workspace)
        {
            if (id != workspace.Id)
                return BadRequest();

            _context.Entry(workspace).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ✅ DELETE: api/workspaces/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var workspace = await _context.Workspaces.FindAsync(id);
            if (workspace == null)
                return NotFound();

            _context.Workspaces.Remove(workspace);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
