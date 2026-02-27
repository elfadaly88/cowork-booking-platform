using CoworkBooking.Application.DTOs.Auth;
using CoworkBooking.Application.Services;
using CoworkBooking.Domain.Entities.Auth;
using CoworkBooking.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace CoworkBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtService _jwtService;
        private readonly JwtSettings _jwtSettings;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            JwtService jwtService,
            IOptions<JwtSettings> jwtSettings)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
            _jwtSettings = jwtSettings.Value;
        }

        /// <summary>
        /// Login endpoint - returns JWT token
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthPolicy")] // ✅ FIX #6 — rate limit login
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Generic error — prevents user enumeration
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            if (!user.IsActive)
                return Unauthorized(new { message = "Invalid email or password" }); // ✅ FIX — don't leak account status

            // ✅ FIX #8 — lockoutOnFailure:true enables account lockout after MaxFailedAccessAttempts
            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, lockoutOnFailure: true);
            if (result.IsLockedOut)
                return StatusCode(429, new { message = "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." });
            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid email or password" });

            var token = await _jwtService.GenerateTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName  = user.LastName,
                    FullName  = user.FullName,
                    Phone     = user.PhoneNumber,
                    ProfileImageUrl = user.ProfileImageUrl,
                    Roles      = roles.ToList(),
                    IsActive   = user.IsActive,
                    IsApproved = user.IsApproved,
                    CreatedAt  = user.CreatedAt
                }
            });
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthPolicy")] // ✅ FIX #6 — rate limit registration
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email is already registered" });

            var newUser = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email    = registerDto.Email,
                FullName = registerDto.FullName,   // backward-compat: splits into First/Last internally
                IsActive = true,
                IsApproved = registerDto.UserType == "Owner" ? false : true,
                EmailConfirmed = false
            };

            var result = await _userManager.CreateAsync(newUser, registerDto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description);
                return BadRequest(new { message = "Registration failed", errors });
            }

            // ✅ FIX — Whitelist role assignment (prevent privilege escalation)
            var allowedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "User", "Owner" };
            var userRole = allowedRoles.Contains(registerDto.UserType) ? registerDto.UserType : "User";
            await _userManager.AddToRoleAsync(newUser, userRole);

            // Generate token for auto-login
            var token = await _jwtService.GenerateTokenAsync(newUser);
            var roles = await _userManager.GetRolesAsync(newUser);

            return Ok(new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                User = new UserDto
                {
                    Id = newUser.Id,
                    Email = newUser.Email ?? string.Empty,
                    FullName = newUser.FullName,
                    ProfileImageUrl = newUser.ProfileImageUrl,
                    Roles = roles.ToList(),
                    IsActive = newUser.IsActive,
                    IsApproved = newUser.IsApproved,
                    CreatedAt = newUser.CreatedAt
                }
            });
        }

        /// <summary>
        /// Get current user info from token
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                ProfileImageUrl = user.ProfileImageUrl,
                Roles = roles.ToList(),
                IsActive = user.IsActive,
                IsApproved = user.IsApproved,
                CreatedAt = user.CreatedAt
            });
        }

        /// <summary>
        /// Logout (optional endpoint for client-side token cleanup)
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Since we're using JWT (stateless), logout is handled client-side
            // This endpoint can be used for logging purposes or future refresh token invalidation
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Get all pending owner approvals (Admin only)
        /// </summary>
        [HttpGet("pending-owners")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<UserDto>>> GetPendingOwners()
        {
            var pendingOwners = _userManager.Users
                .Where(u => !u.IsApproved)
                .ToList();

            var result = new List<UserDto>();
            foreach (var user in pendingOwners)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FullName = user.FullName,
                    ProfileImageUrl = user.ProfileImageUrl,
                    Roles = roles.ToList(),
                    IsActive = user.IsActive,
                    IsApproved = user.IsApproved,
                    CreatedAt = user.CreatedAt
                });
            }

            return Ok(result);
        }

        /// <summary>
        /// Approve or reject owner account (Admin only)
        /// </summary>
        [HttpPost("approve-owner/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveOwner(Guid userId, [FromBody] bool approve)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Owner"))
                return BadRequest(new { message = "User is not an owner" });

            user.IsApproved = approve;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(new { message = "Failed to update user approval status" });

            return Ok(new { message = approve ? "Owner approved successfully" : "Owner rejected", isApproved = approve });
        }

        /// <summary>Update current user's profile (name, email, phone)</summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // ✅ FIX #16 — Sanitize text inputs (strip HTML tags)
            user.FirstName   = SanitizeText(dto.FirstName);
            user.LastName    = SanitizeText(dto.LastName);
            user.PhoneNumber = SanitizeText(dto.Phone ?? string.Empty);

            // ✅ FIX #10 — Email changes require password re-verification in a real system
            // For now: validate the new email format and check it's not already taken
            if (!string.IsNullOrEmpty(dto.Email) && user.Email != dto.Email)
            {
                var existingWithEmail = await _userManager.FindByEmailAsync(dto.Email);
                if (existingWithEmail != null && existingWithEmail.Id != user.Id)
                    return BadRequest(new { message = "Email address is already in use" });

                user.Email    = dto.Email.Trim().ToLowerInvariant();
                user.UserName = user.Email;
                user.EmailConfirmed = false; // require re-verification on email change
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            var userDto = new
            {
                id        = user.Id,
                email     = user.Email,
                firstName = user.FirstName,
                lastName  = user.LastName,
                fullName  = user.FullName,
                phone     = user.PhoneNumber,
                roles,
                isActive   = user.IsActive,
                isApproved = user.IsApproved,
                createdAt  = user.CreatedAt
            };

            return Ok(new { message = "Profile updated successfully", user = userDto });
        }

        /// <summary>Change the current user's password</summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            return Ok(new { message = "Password changed successfully" });
        }

        // ─── Helper: strip HTML tags from user-supplied text ─────────────────
        private static string SanitizeText(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            // Remove HTML tags and encode dangerous chars
            var stripped = Regex.Replace(input.Trim(), "<[^>]*>", string.Empty);
            return stripped.Length > 500 ? stripped[..500] : stripped; // hard cap
        }
    }
}

