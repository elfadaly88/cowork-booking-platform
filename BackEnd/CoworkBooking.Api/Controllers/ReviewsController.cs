using CoworkBooking.Domain.Entities;
using CoworkBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/workspaces/{workspaceId}/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ReviewsController(AppDbContext db) => _db = db;

        // GET api/workspaces/{id}/reviews
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get(int workspaceId)
        {
            var reviews = await _db.WorkspaceReviews
                .Where(r => r.WorkspaceId == workspaceId)
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.WorkspaceId,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    r.UpdatedAt,
                    UserName = r.User.FullName,
                    UserInitials = (r.User.FirstName.Length > 0 ? r.User.FirstName.Substring(0, 1) : "")
                                + (r.User.LastName.Length  > 0 ? r.User.LastName.Substring(0, 1)  : "")
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // POST api/workspaces/{id}/reviews  — create or update (upsert)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Upsert(int workspaceId, [FromBody] ReviewRequest req)
        {
            if (req.Rating < 1 || req.Rating > 5)
                return BadRequest(new { message = "Rating must be 1–5" });

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            // Verify workspace exists
            if (!await _db.Workspaces.AnyAsync(w => w.Id == workspaceId))
                return NotFound(new { message = "Workspace not found" });

            // ✅ FIX #16 — Sanitize comment: strip HTML tags, hard-limit length
            var safeComment = SanitizeComment(req.Comment);

            var existing = await _db.WorkspaceReviews
                .FirstOrDefaultAsync(r => r.WorkspaceId == workspaceId && r.UserId == userId);

            if (existing != null)
            {
                existing.Rating    = req.Rating;
                existing.Comment   = safeComment;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.WorkspaceReviews.Add(new WorkspaceReview
                {
                    WorkspaceId = workspaceId,
                    UserId      = userId,
                    Rating      = req.Rating,
                    Comment     = safeComment,
                    CreatedAt   = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            await RecalcRating(workspaceId);

            return Ok(new { message = existing != null ? "Review updated" : "Review submitted" });
        }

        // DELETE api/workspaces/{id}/reviews/mine
        [HttpDelete("mine")]
        [Authorize]
        public async Task<IActionResult> DeleteMine(int workspaceId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var review = await _db.WorkspaceReviews
                .FirstOrDefaultAsync(r => r.WorkspaceId == workspaceId && r.UserId == userId);

            if (review == null) return NotFound(new { message = "No review found" });

            _db.WorkspaceReviews.Remove(review);
            await _db.SaveChangesAsync();
            await RecalcRating(workspaceId);

            return Ok(new { message = "Review deleted" });
        }

        // GET api/workspaces/{id}/reviews/mine
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine(int workspaceId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var review = await _db.WorkspaceReviews
                .FirstOrDefaultAsync(r => r.WorkspaceId == workspaceId && r.UserId == userId);

            if (review == null) return Ok(null);
            return Ok(new { review.Id, review.Rating, review.Comment, review.CreatedAt });
        }

        private async Task RecalcRating(int workspaceId)
        {
            var workspace = await _db.Workspaces.FindAsync(workspaceId);
            if (workspace == null) return;

            var stats = await _db.WorkspaceReviews
                .Where(r => r.WorkspaceId == workspaceId)
                .GroupBy(r => r.WorkspaceId)
                .Select(g => new { Avg = g.Average(r => (double)r.Rating), Count = g.Count() })
                .FirstOrDefaultAsync();

            workspace.AverageRating = stats?.Avg;
            workspace.TotalReviews  = stats?.Count ?? 0;
            await _db.SaveChangesAsync();
        }

        // ✅ FIX #16 — Strip HTML/script tags from user-supplied comment text
        private static string? SanitizeComment(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var stripped = Regex.Replace(input.Trim(), "<[^>]+>", string.Empty);
            return stripped.Length > 2000 ? stripped[..2000] : stripped;
        }
    }

    public record ReviewRequest(int Rating, string? Comment);
}
