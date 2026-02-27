using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CoworkBooking.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using CoworkBooking.Domain.Entities;

namespace CoworkBooking.Api.Controllers
{
    /// <summary>Upload and manage photos for a workspace (Owner/Admin only)</summary>
    [ApiController]
    [Route("api/workspaces/{workspaceId}/images")]
    [Authorize]
    public class WorkspaceImagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        // ✅ FIX #4/#15 — Allowed MIME types mapped to extensions (magic-byte validation)
        private static readonly Dictionary<string, string[]> AllowedMimeToExtensions = new()
        {
            { "image/jpeg",  new[] { ".jpg", ".jpeg" } },
            { "image/png",   new[] { ".png"          } },
            { "image/webp",  new[] { ".webp"         } },
            { "image/gif",   new[] { ".gif"          } },
        };

        private const int MaxFileSizeBytes  = 5_000_000;   // ✅ FIX #15 — 5 MB per file
        private const int MaxImagesPerWorkspace = 20;       // reasonable upper bound

        public WorkspaceImagesController(AppDbContext db, IWebHostEnvironment env)
        {
            _db  = db;
            _env = env;
        }

        // GET api/workspaces/{id}/images  — public
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get(int workspaceId)
        {
            var images = await _db.WorkspaceImages
                .Where(i => i.WorkspaceId == workspaceId)
                .OrderBy(i => i.Order)
                .Select(i => new { i.Id, i.Url, i.Caption, i.IsMain, i.Order })
                .ToListAsync();
            return Ok(images);
        }

        // POST api/workspaces/{id}/images — Owner/Admin only
        [HttpPost]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> Upload(int workspaceId, [FromForm] IFormFileCollection files,
            [FromForm] bool setFirstAsMain = false)
        {
            if (files == null || !files.Any())
                return BadRequest(new { message = "No files uploaded" });

            var workspace = await _db.Workspaces.FindAsync(workspaceId);
            if (workspace == null) return NotFound(new { message = "Workspace not found" });

            // ✅ Authorization: only admin or the workspace owner
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && workspace.OwnerId.ToString() != userId)
                return Forbid();

            // ✅ FIX — Cap total images per workspace
            var existing = await _db.WorkspaceImages.CountAsync(i => i.WorkspaceId == workspaceId);
            if (existing + files.Count > MaxImagesPerWorkspace)
                return BadRequest(new { message = $"Maximum {MaxImagesPerWorkspace} images allowed per workspace." });

            var uploadsPath = Path.Combine(
                _env.WebRootPath ?? "wwwroot", "uploads", "workspaces", workspaceId.ToString());
            Directory.CreateDirectory(uploadsPath);

            var added = new List<object>();

            foreach (var (file, index) in files.Select((f, i) => (f, i)))
            {
                if (file.Length == 0) continue;

                // ✅ FIX #15 — Per-file size check
                if (file.Length > MaxFileSizeBytes)
                    return BadRequest(new { message = $"File '{file.FileName}' exceeds the 5 MB limit." });

                // ✅ FIX #3/#4 — Validate MIME type from Content-Type header AND magic bytes
                if (!TryGetSafeExtension(file, out var safeExt))
                    return BadRequest(new { message = $"File '{file.FileName}' is not a supported image type. Only JPEG, PNG, WebP, and GIF are allowed." });

                // ✅ FIX #3 — Generate completely new filename using GUID — never trust original name
                var safeFileName = $"{Guid.NewGuid():N}{safeExt}";
                var filePath = Path.Combine(uploadsPath, safeFileName);

                // Extra guard: ensure final path stays inside uploads folder
                var canonicalUploads = Path.GetFullPath(uploadsPath);
                var canonicalFile    = Path.GetFullPath(filePath);
                if (!canonicalFile.StartsWith(canonicalUploads, StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "Invalid file path." });

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                var anyMain = await _db.WorkspaceImages.AnyAsync(i => i.WorkspaceId == workspaceId && i.IsMain);
                var isMain  = (setFirstAsMain && index == 0 && existing == 0) || (!anyMain && index == 0);

                var img = new WorkspaceImage
                {
                    WorkspaceId = workspaceId,
                    Url         = $"/uploads/workspaces/{workspaceId}/{safeFileName}",
                    IsMain      = isMain,
                    Order       = existing + index,
                    UploadedAt  = DateTime.UtcNow
                };

                _db.WorkspaceImages.Add(img);
                added.Add(new { img.Url, img.IsMain, img.Order });
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = $"{added.Count} image(s) uploaded", images = added });
        }

        // DELETE api/workspaces/{id}/images/{imageId} — Owner/Admin only
        [HttpDelete("{imageId}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> Delete(int workspaceId, int imageId)
        {
            var image = await _db.WorkspaceImages.FindAsync(imageId);
            if (image == null || image.WorkspaceId != workspaceId) return NotFound();

            var workspace = await _db.Workspaces.FindAsync(workspaceId);
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!User.IsInRole("Admin") && workspace?.OwnerId.ToString() != userId) return Forbid();

            // ✅ FIX #3 — Canonicalize before deleting to prevent path traversal
            var webRoot = Path.GetFullPath(_env.WebRootPath ?? "wwwroot");
            var filePath = Path.GetFullPath(Path.Combine(webRoot, image.Url.TrimStart('/')));
            if (filePath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            _db.WorkspaceImages.Remove(image);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Image deleted" });
        }

        // PATCH api/workspaces/{id}/images/{imageId}/set-main — Owner/Admin only
        [HttpPatch("{imageId}/set-main")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> SetMain(int workspaceId, int imageId)
        {
            var workspace = await _db.Workspaces.FindAsync(workspaceId);
            if (workspace == null) return NotFound(new { message = "Workspace not found" });

            // ✅ FIX #18 — IDOR fix: verify the caller owns the workspace
            var userId  = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && workspace.OwnerId.ToString() != userId) return Forbid();

            var images = await _db.WorkspaceImages.Where(i => i.WorkspaceId == workspaceId).ToListAsync();
            if (!images.Any(i => i.Id == imageId)) return NotFound(new { message = "Image not found" });

            foreach (var img in images) img.IsMain = img.Id == imageId;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Cover image updated" });
        }

        // ─── Private helpers ────────────────────────────────────────────────────

        /// <summary>
        /// ✅ FIX #3/#4 — Validates file by MIME type (from Content-Type) AND reads the first
        /// 12 magic bytes to verify the actual file format. Returns a safe extension.
        /// </summary>
        private static bool TryGetSafeExtension(IFormFile file, out string safeExt)
        {
            safeExt = string.Empty;

            // Step 1: Check Content-Type
            var contentType = file.ContentType?.ToLowerInvariant() ?? "";
            if (!AllowedMimeToExtensions.TryGetValue(contentType, out var validExts))
                return false;

            // Step 2: Check magic bytes (file signature)
            using var stream = file.OpenReadStream();
            var header = new byte[12];
            var read   = stream.Read(header, 0, header.Length);
            stream.Seek(0, SeekOrigin.Begin);

            if (!IsValidImageSignature(header, read, contentType))
                return false;

            // Step 3: Use the first valid extension for that MIME type (ignore original filename)
            safeExt = validExts[0];
            return true;
        }

        private static bool IsValidImageSignature(byte[] header, int read, string mimeType)
        {
            if (read < 4) return false;

            return mimeType switch
            {
                "image/jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                "image/png"  => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,
                "image/gif"  => header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46,
                "image/webp" => read >= 12 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                             && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
                _ => false
            };
        }
    }
}
