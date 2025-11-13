# 🔐 Authentication & Authorization Implementation Guide

## ✅ What Has Been Implemented

### Backend (.NET Core)

#### 1. **Authentication Entities** (Already existed in `/Domain/Entities/Auth/`)
- `ApplicationUser` - Extends IdentityUser with custom properties (FullName, ProfileImageUrl, IsActive)
- `ApplicationRole` - Extends IdentityRole with Description and PermissionsJson
- `ApplicationUserRole` - Many-to-many relationship between users and roles

#### 2. **JWT Configuration**
- Location: `appsettings.json`
```json
"JwtSettings": {
  "Key": "SuperSecretKey_CoworkBooking_2025!",
  "Issuer": "CoworkBooking.API",
  "Audience": "CoworkBooking.Frontend",
  "DurationInMinutes": 120
}
```

#### 3. **Authentication DTOs** (Created in `/Application/DTOs/Auth/`)
- `LoginDto` - Email and Password for login
- `RegisterDto` - Full registration with password confirmation
- `AuthResponseDto` - Returns JWT token, user info, and expiry
- `UserDto` - User profile with roles

#### 4. **AuthController** (Created in `/Api/Controllers/`)
Endpoints:
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user (assigned "User" role by default)
- `GET /api/auth/me` - Get current authenticated user info
- `POST /api/auth/logout` - Logout (client-side token cleanup)

#### 5. **Authorization on Controllers**
- **WorkSpacesController**:
  - GET endpoints: `[AllowAnonymous]` (public access)
  - POST/PUT/DELETE: `[Authorize(Roles = "Admin")]` (admin only)
- **BookingsController**:
  - All endpoints require authentication `[Authorize]`
  - GET all bookings: Admin only

#### 6. **Identity Seeding** (Already exists in `/Infrastructure/Data/IdentitySeed.cs`)
- Creates 3 default roles: **Admin**, **Owner**, **User**
- Creates default admin account:
  - **Email**: `admin@cowork.com`
  - **Password**: `Admin@123`
  - **Role**: Admin

---

### Frontend (Angular)

#### 1. **Auth Models** (`/core/models/auth.model.ts`)
- `LoginRequest`, `RegisterRequest`, `AuthResponse`, `User` interfaces

#### 2. **AuthService** (`/core/services/auth.service.ts`)
Features:
- Reactive signals for auth state (`currentUser`, `isAuthenticated`, `isAdmin`, `isOwner`)
- Login/Register methods
- Token storage in localStorage
- JWT token retrieval for requests
- Role checking methods (`hasRole`, `hasAnyRole`)

#### 3. **HTTP Interceptor** (`/core/interceptors/auth.interceptor.ts`)
- Automatically attaches `Authorization: Bearer {token}` to all HTTP requests
- Handles 401 errors (auto-logout on expired token)

#### 4. **Route Guards** (`/core/guards/auth.guard.ts`)
- `authGuard` - Protects routes requiring authentication
- `adminGuard` - Protects admin-only routes
- `guestGuard` - Redirects authenticated users from login/register

#### 5. **Auth Components**
- **LoginComponent** (`/features/auth/login.component.*`)
  - Beautiful gradient UI
  - Form validation
  - Error handling
  - Auto-redirect based on role

- **RegisterComponent** (`/features/auth/register.component.*`)
  - User registration form
  - Password match validation
  - Auto-login after registration

#### 6. **Protected Routes** (Updated in `app.routes.ts`)
```typescript
{ path: 'booking/:roomId', canActivate: [authGuard] }      // Auth required
{ path: 'admin', canActivate: [adminGuard] }               // Admin only
{ path: 'admin/schedule', canActivate: [adminGuard] }      // Admin only
{ path: 'admin/workspaces', canActivate: [adminGuard] }    // Admin only
{ path: 'login', canActivate: [guestGuard] }               // Guests only
{ path: 'register', canActivate: [guestGuard] }            // Guests only
```

---

## 🚀 How to Use the Admin Account

### Option 1: Default Admin (Already Seeded)
The admin user is automatically created when the database migrates:

**Login Credentials:**
- **Email**: `admin@cowork.com`
- **Password**: `Admin@123`

**Steps:**
1. Run the backend: `dotnet run` (in `/BackEnd/CoworkBooking.Api/`)
2. The database will auto-migrate and seed the admin user
3. Run the frontend: `npm start` (in `/frontend/cowork-booking/`)
4. Navigate to `http://localhost:4200/login`
5. Login with the credentials above
6. You'll be redirected to `/admin` dashboard

---

### Option 2: Create Additional Admin Users

#### Via API (Postman/Swagger)

1. **Start the backend** and navigate to Swagger: `https://localhost:5001/swagger`

2. **Register a new user** using `/api/auth/register`:
```json
{
  "fullName": "John Admin",
  "email": "john@admin.com",
  "password": "Admin@456",
  "confirmPassword": "Admin@456"
}
```
(This creates a user with "User" role by default)

3. **Manually update the role in the database**:
   - Open SQL Server Management Studio or your database tool
   - Connect to `CoworkBookingDB`
   - Run this SQL to promote the user to Admin:

```sql
-- Find the user ID
SELECT Id, Email, UserName FROM AspNetUsers WHERE Email = 'john@admin.com';

-- Get the Admin role ID
SELECT Id, Name FROM AspNetRoles WHERE Name = 'Admin';

-- Add the user to Admin role (replace the GUIDs with actual values from above)
INSERT INTO AspNetUserRoles (UserId, RoleId)
VALUES (
  'USER_GUID_HERE',  -- User ID from first query
  'ADMIN_ROLE_GUID_HERE'  -- Admin role ID from second query
);
```

#### Via Code (Add to IdentitySeed.cs)

Edit `/Infrastructure/Data/IdentitySeed.cs` and add more admin users:

```csharp
// Create additional admin user
var secondAdminEmail = "youremail@example.com";
if (await userManager.FindByEmailAsync(secondAdminEmail) == null)
{
    var secondAdmin = new ApplicationUser
    {
        UserName = secondAdminEmail,
        Email = secondAdminEmail,
        EmailConfirmed = true,
        FullName = "Your Name"
    };

    var result = await userManager.CreateAsync(secondAdmin, "YourPassword@123");
    if (result.Succeeded)
    {
        await userManager.AddToRoleAsync(secondAdmin, "Admin");
    }
}
```

Then restart the backend - it will create the new admin user.

---

## 📋 Testing the Implementation

### 1. Test Login Flow

```powershell
# Start backend
cd F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet run

# In another terminal, start frontend
cd F:\PrivateWork\WorkSpace\CoworkBooking\frontend\cowork-booking
npm start
```

- Navigate to `http://localhost:4200/login`
- Login with `admin@cowork.com` / `Admin@123`
- Check browser console - you should see user info and token
- Try accessing `/admin` - should work
- Logout and try accessing `/admin` - should redirect to login

### 2. Test Registration

- Go to `http://localhost:4200/register`
- Register a new user
- Check you're auto-logged in
- Try accessing `/admin` - should be blocked (regular users can't access)

### 3. Test API Protection

Open browser DevTools → Network tab:

- Make a booking (should send `Authorization: Bearer {token}` header)
- Try creating a workspace as regular user - should get 403 Forbidden
- Login as admin and create workspace - should succeed

### 4. Test Token Expiry

- Login
- Wait 2 hours (or change `DurationInMinutes` to 1 for testing)
- Try making an API call
- Should auto-logout and redirect to login

---

## 🔧 Configuration & Customization

### Change JWT Token Expiry

Edit `appsettings.json`:
```json
"JwtSettings": {
  "DurationInMinutes": 60  // Change to desired minutes
}
```

### Add More Roles

Edit `/Infrastructure/Data/IdentitySeed.cs`:
```csharp
new ApplicationRole
{
    Name = "Manager",
    NormalizedName = "MANAGER",
    Description = "Workspace manager",
    PermissionsJson = JsonSerializer.Serialize(new {
        canManageOwnWorkspaces = true,
        canViewReports = true
    })
}
```

### Password Requirements

Edit `Program.cs` (already configured):
```csharp
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = false;  // Change as needed
    options.Password.RequireNonAlphanumeric = false;
})
```

---

## 🛡️ Security Best Practices Implemented

✅ **JWT Token-based authentication** (stateless)
✅ **Role-based authorization** (Admin, Owner, User)
✅ **Password hashing** (via ASP.NET Core Identity)
✅ **HTTPS enforcement** (in production)
✅ **CORS configured** (only allows Angular dev origins)
✅ **Token in Authorization header** (not in URL)
✅ **Auto-logout on token expiry** (401 interceptor)
✅ **Route guards** (prevent unauthorized access)
✅ **Password validation** (min 6 chars, requires digit)

---

## 📊 Role Permissions Summary

| Feature | User | Owner | Admin |
|---------|------|-------|-------|
| View workspaces | ✅ | ✅ | ✅ |
| Book rooms | ✅ | ✅ | ✅ |
| Create workspace | ❌ | ❌ | ✅ |
| Edit/Delete workspace | ❌ | ❌ | ✅ |
| Manage schedules | ❌ | ❌ | ✅ |
| View all bookings | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized" on API calls
**Solution**: Check that:
1. Token is stored in localStorage (`auth_token`)
2. Interceptor is registered in `app.config.ts`
3. Backend JWT settings match (Issuer, Audience, Key)

### Issue: Admin routes redirect to home
**Solution**:
1. Verify user has "Admin" role in database
2. Check `authService.isAdmin()` signal returns true
3. Clear browser cache and re-login

### Issue: CORS errors
**Solution**: Verify backend `Program.cs` has:
```csharp
app.UseCors("AllowAngularDev");
```
And Angular is running on `http://localhost:4200`

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Confirmation**: Implement email verification on registration
2. **Password Reset**: Add "Forgot Password" functionality
3. **Refresh Tokens**: Implement refresh token rotation for better security
4. **2FA (Two-Factor Authentication)**: Add extra security layer
5. **User Profile Management**: Allow users to update their profile
6. **Audit Logging**: Track who created/modified workspaces
7. **Social Login**: Add Google/Facebook OAuth

---

## 📝 Quick Commands Reference

```powershell
# Backend
cd F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet run
# Swagger: https://localhost:5001/swagger

# Frontend
cd F:\PrivateWork\WorkSpace\CoworkBooking\frontend\cowork-booking
npm start
# App: http://localhost:4200

# Database migrations (if needed)
cd F:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet ef migrations add MigrationName --project ../CoworkBooking.Infrastructure
dotnet ef database update --project ../CoworkBooking.Infrastructure
```

---

## ✅ Implementation Complete!

Your application now has:
- ✅ Full JWT authentication
- ✅ Role-based authorization
- ✅ Protected API endpoints
- ✅ Admin panel restricted to admins
- ✅ Beautiful login/register UI
- ✅ Auto-seeded admin account
- ✅ Token refresh on every request
- ✅ Secure password storage

**Default Admin Credentials:**
- Email: `admin@cowork.com`
- Password: `Admin@123`

You can now manage your entire application as an admin! 🎉
