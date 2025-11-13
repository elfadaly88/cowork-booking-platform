# 🎯 Quick Start Guide - Authentication & Authorization

## ⚡ Start the Application

### Option 1: Using PowerShell Script (Recommended)
```powershell
# Navigate to project root
cd F:\PrivateWork\WorkSpace\CoworkBooking

# Run the startup script
.\start-app.ps1
```
This will open two PowerShell windows - one for backend, one for frontend.

### Option 2: Manual Start
```powershell
# Terminal 1 - Backend
cd F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet run

# Terminal 2 - Frontend
cd F:\PrivateWork\WorkSpace\CoworkBooking\frontend\cowork-booking
npm start
```

---

## 🔐 Login as Admin

1. Open browser: `http://localhost:4200`
2. Click "Login" or navigate to `http://localhost:4200/login`
3. Enter credentials:
   - **Email**: `admin@cowork.com`
   - **Password**: `Admin@123`
4. Click "Sign In"
5. You'll be redirected to `/admin` dashboard

---

## 🧪 Test the Authentication

Run the test script:
```powershell
cd F:\PrivateWork\WorkSpace\CoworkBooking
.\test-auth.ps1
```

This will test:
- ✅ User registration
- ✅ Admin login
- ✅ Get current user endpoint
- ✅ Protected workspace endpoint

---

## 🎨 User Flows

### Regular User Flow
1. Visit `http://localhost:4200`
2. Click "Register" → Create account
3. Auto-logged in as "User" role
4. Can view workspaces and make bookings
5. **Cannot** access `/admin` routes (will be redirected)

### Admin User Flow
1. Login with `admin@cowork.com` / `Admin@123`
2. Full access to all features
3. Can create/edit/delete workspaces
4. Can manage schedules
5. Can view all bookings

---

## 📍 Important URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:4200 | Main app |
| Login | http://localhost:4200/login | Auth page |
| Register | http://localhost:4200/register | Sign up |
| Admin Panel | http://localhost:4200/admin | Admin only |
| Backend API | https://localhost:5001 | REST API |
| Swagger Docs | https://localhost:5001/swagger | API docs |

---

## 🔑 Default Accounts

### Admin Account (Pre-seeded)
- **Email**: `admin@cowork.com`
- **Password**: `Admin@123`
- **Roles**: Admin
- **Permissions**: Full access to everything

---

## 🛠️ Key Features Implemented

### Backend
✅ JWT token generation and validation
✅ ASP.NET Core Identity (user/role management)
✅ Role-based authorization ([Authorize(Roles = "Admin")])
✅ Password hashing and validation
✅ Auto-seeding of roles and admin user
✅ CORS configured for Angular
✅ Protected API endpoints

### Frontend
✅ Login/Register components with validation
✅ AuthService with reactive signals
✅ HTTP interceptor (auto-attach JWT token)
✅ Route guards (auth, admin, guest)
✅ Token storage in localStorage
✅ Auto-logout on 401 errors
✅ Role-based UI (show/hide admin links)

---

## 📂 File Structure

### Backend
```
BackEnd/
├── CoworkBooking.Api/
│   └── Controllers/
│       └── AuthController.cs         ← Login, Register, Logout endpoints
├── CoworkBooking.Application/
│   ├── DTOs/Auth/                    ← Auth DTOs
│   │   ├── LoginDto.cs
│   │   ├── RegisterDto.cs
│   │   ├── AuthResponseDto.cs
│   │   └── UserDto.cs
│   └── Services/
│       └── JwtService.cs             ← JWT token generation
├── CoworkBooking.Domain/
│   └── Entities/Auth/                ← Identity entities
│       ├── ApplicationUser.cs
│       ├── ApplicationRole.cs
│       └── ApplicationUserRole.cs
└── CoworkBooking.Infrastructure/
    ├── Configuration/
    │   └── JwtSettings.cs
    └── Data/
        ├── AppDbContext.cs           ← EF Core context
        └── IdentitySeed.cs           ← Role & admin seeding
```

### Frontend
```
frontend/cowork-booking/src/app/
├── core/
│   ├── models/
│   │   └── auth.model.ts             ← Auth interfaces
│   ├── services/
│   │   └── auth.service.ts           ← Auth service with signals
│   ├── guards/
│   │   └── auth.guard.ts             ← Route guards
│   └── interceptors/
│       └── auth.interceptor.ts       ← JWT interceptor
└── features/
    └── auth/
        ├── login.component.*         ← Login UI
        └── register.component.*      ← Register UI
```

---

## 🔍 Debugging Tips

### Check if User is Logged In (Browser Console)
```javascript
// Check token
localStorage.getItem('auth_token')

// Check user
localStorage.getItem('auth_user')
```

### Test API with Token (PowerShell)
```powershell
$token = "your_jwt_token_here"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "https://localhost:5001/api/auth/me" -Headers $headers -SkipCertificateCheck
```

### View Database Users (SQL)
```sql
SELECT u.Email, u.FullName, u.IsActive, r.Name as Role
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
```

---

## 🚨 Common Issues & Fixes

### Issue: "Cannot login - 401 Unauthorized"
**Fix**: Backend not running or wrong credentials
```powershell
cd F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet run
```

### Issue: "CORS error in browser"
**Fix**: Make sure backend `Program.cs` has:
```csharp
app.UseCors("AllowAngularDev");
```
And Angular runs on `http://localhost:4200`

### Issue: "Admin routes redirect to home"
**Fix**: Verify you're logged in as admin:
```javascript
// Browser console
JSON.parse(localStorage.getItem('auth_user')).roles
// Should include "Admin"
```

### Issue: "Token expired"
**Fix**: Login again. Token expires after 2 hours (configurable in `appsettings.json`)

---

## 📖 Full Documentation

For complete details, see: `AUTHENTICATION_GUIDE.md`

---

## ✅ Checklist Before Going Live

- [ ] Change JWT secret key in `appsettings.json` (use strong random string)
- [ ] Change default admin password
- [ ] Enable HTTPS in production
- [ ] Set `production: true` in Angular environment
- [ ] Configure production database connection string
- [ ] Enable email confirmation for registration
- [ ] Add password reset functionality
- [ ] Implement refresh tokens
- [ ] Add rate limiting to login endpoint
- [ ] Set up proper logging and monitoring

---

## 🎉 You're All Set!

Your application now has enterprise-grade authentication and authorization!

**Next Steps:**
1. Run `.\start-app.ps1`
2. Login as admin
3. Start managing workspaces!

For questions or issues, check `AUTHENTICATION_GUIDE.md` for detailed troubleshooting.
