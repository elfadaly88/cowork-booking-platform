using CoworkBooking.Application.DTOs;
using CoworkBooking.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CoworkBooking.Api.Controllers
{
 [ApiController]
 [Route("api/[controller]")]
 public class DevicesController : ControllerBase
 {
 private readonly IDeviceService _service;

 public DevicesController(IDeviceService service)
 {
 _service = service;
 }

 [HttpGet]
 public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

 [HttpGet("{id}")]
 public async Task<IActionResult> GetById(int id)
 {
 var d = await _service.GetByIdAsync(id);
 if (d == null) return NotFound();
 return Ok(d);
 }

 [HttpPost]
 public async Task<IActionResult> Create([FromBody] DeviceDto dto)
 {
 if (dto == null) return BadRequest();
 var created = await _service.CreateAsync(dto);
 return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
 }

 [HttpPut("{id}")]
 public async Task<IActionResult> Update(int id, [FromBody] DeviceDto dto)
 {
 if (dto == null || dto.Id != id) return BadRequest();
 var existing = await _service.GetByIdAsync(id);
 if (existing == null) return NotFound();
 await _service.UpdateAsync(dto);
 return NoContent();
 }

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
