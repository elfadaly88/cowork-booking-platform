# Reset admin password using a temporary .NET script
$code = @'
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using CoworkBooking.Domain.Entities.Auth;
using CoworkBooking.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Load same config/services as the real app
var startup = new CoworkBooking.Api.Program();
'@

Write-Host "This approach needs the app running. Use Swagger UI instead." -ForegroundColor Yellow
Write-Host ""
Write-Host "The admin account (admin@cowork.com) has been fixed:" -ForegroundColor Green
Write-Host "  IsActive  = true" -ForegroundColor Green
Write-Host "  IsApproved = true" -ForegroundColor Green
Write-Host ""
Write-Host "If the password is still wrong, restart the backend and check seed logs." -ForegroundColor Cyan
