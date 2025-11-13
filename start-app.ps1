# 🚀 CoworkBooking Startup Script
# This script starts both backend and frontend

Write-Host "🔧 Starting CoworkBooking Application..." -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "📦 Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api'; Write-Host '🌐 Backend API starting...' -ForegroundColor Green; dotnet run"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Frontend
Write-Host "🎨 Starting Frontend Angular App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'F:\PrivateWork\WorkSpace\CoworkBooking\frontend\cowork-booking'; Write-Host '🌐 Frontend starting...' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Points:" -ForegroundColor Cyan
Write-Host "  Backend API:     https://localhost:5001" -ForegroundColor White
Write-Host "  Swagger Docs:    https://localhost:5001/swagger" -ForegroundColor White
Write-Host "  Frontend App:    http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    admin@cowork.com" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
