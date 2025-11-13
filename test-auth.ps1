# 🧪 Test Authentication Endpoints
# This script tests the auth API endpoints

$baseUrl = "https://localhost:5001/api"

Write-Host "🧪 Testing Authentication API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Register a new user
Write-Host "1️⃣ Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    fullName = "Test User"
    email = "test@example.com"
    password = "Test@123"
    confirmPassword = "Test@123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -SkipCertificateCheck
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User: $($registerResponse.user.fullName) ($($registerResponse.user.email))" -ForegroundColor White
    Write-Host "   Token: $($registerResponse.token.Substring(0, 20))..." -ForegroundColor Gray
    $token = $registerResponse.token
} catch {
    Write-Host "ℹ️ Registration failed (user may already exist)" -ForegroundColor Yellow
    $token = $null
}

Write-Host ""

# Test 2: Login with admin
Write-Host "2️⃣ Testing Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cowork.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -SkipCertificateCheck
    Write-Host "✅ Admin login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.fullName)" -ForegroundColor White
    Write-Host "   Roles: $($loginResponse.user.roles -join ', ')" -ForegroundColor White
    Write-Host "   Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
    $adminToken = $loginResponse.token
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    $adminToken = $null
}

Write-Host ""

# Test 3: Get current user info (with admin token)
if ($adminToken) {
    Write-Host "3️⃣ Testing Get Current User..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $adminToken"
    }

    try {
        $meResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers -SkipCertificateCheck
        Write-Host "✅ Current user retrieved!" -ForegroundColor Green
        Write-Host "   Email: $($meResponse.email)" -ForegroundColor White
        Write-Host "   Full Name: $($meResponse.fullName)" -ForegroundColor White
        Write-Host "   Roles: $($meResponse.roles -join ', ')" -ForegroundColor White
        Write-Host "   Is Active: $($meResponse.isActive)" -ForegroundColor White
    } catch {
        Write-Host "❌ Get current user failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Access protected workspace endpoint
if ($adminToken) {
    Write-Host "4️⃣ Testing Protected Workspace Endpoint..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $adminToken"
    }

    try {
        $workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Get -Headers $headers -SkipCertificateCheck
        Write-Host "✅ Workspaces retrieved successfully!" -ForegroundColor Green
        Write-Host "   Total workspaces: $($workspaces.Count)" -ForegroundColor White
    } catch {
        Write-Host "❌ Failed to get workspaces: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Authentication testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
