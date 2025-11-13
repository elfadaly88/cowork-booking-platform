using CoworkBooking.Application.DTOs.Auth;
using CoworkBooking.Application.Services;
using CoworkBooking.Domain.Entities.Auth;
using CoworkBooking.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

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
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            if (!user.IsActive)
                return Unauthorized(new { message = "Account is inactive. Please contact support." });

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
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
                    FullName = user.FullName,
                    ProfileImageUrl = user.ProfileImageUrl,
                    Roles = roles.ToList(),
                    IsActive = user.IsActive,
                    IsApproved = user.IsApproved,
                    CreatedAt = user.CreatedAt
                }
            });
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
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
                Email = registerDto.Email,
                FullName = registerDto.FullName,
                IsActive = true,
                IsApproved = registerDto.UserType == "Owner" ? false : true, // Owner needs admin approval
                EmailConfirmed = false // You can implement email confirmation later
            };

            var result = await _userManager.CreateAsync(newUser, registerDto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description);
                return BadRequest(new { message = "Registration failed", errors });
            }

            // Assign role based on user type selection (User or Owner)
            var userRole = registerDto.UserType == "Owner" ? "Owner" : "User";
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
    }
}
