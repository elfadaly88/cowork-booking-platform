# CoworkBooking Scheduling & Availability Feature Guide

This guide explains the new workspace scheduling and availability features added to the CoworkBooking platform.

## ✨ Features Implemented

### Backend (ASP.NET Core)

1. **New Domain Entities**
   - `WorkspaceSchedulePeriod`: Represents a time-based configuration period for a workspace
   - `WorkspaceSchedule`: Defines working hours per day of the week within a period

2. **Enhanced Entities**
   - `WorkSpace`: Now includes `SchedulePeriods` collection
   - `Room`: BookedCount and AvailableSeats computed dynamically based on active bookings

3. **Enhanced Services**
   - `WorkSpaceService.GetAvailableWorkspacesAsync()`: Returns only workspaces with available rooms
   - `WorkspaceScheduleService.AddOrReplaceSchedulePeriodAsync()`: Handles period overlap removal
   - `WorkspaceScheduleService.GetActiveSchedulePeriodAsync()`: Retrieves active period for current date

4. **New API Endpoints**
   - `GET /api/workspaces/available`: Returns workspaces with at least one room having available seats
   - `GET /api/workspaces/{id}/schedule`: Returns active schedule period for workspace
   - `POST /api/workspaces/{id}/schedule`: Adds or replaces schedule period (removes overlaps)

5. **Database Changes**
   - New tables: `WorkspaceSchedulePeriods`, `WorkspaceSchedules`
   - Relationships configured with cascade delete
   - Seed data includes current year schedule (Sun-Thu 09:00-18:00, Fri-Sat weekend)

### Frontend (Angular 19)

1. **Updated Models**
   - `Room` interface now includes `bookedCount` and `availableSeats`
   - New interfaces: `WorkspaceSchedule`, `WorkspaceSchedulePeriod`

2. **Enhanced Services**
   - `WorkspaceService.getAvailableWorkspaces()`: Fetches only available workspaces
   - `WorkspaceService.getActiveSchedule()`: Retrieves workspace schedule
   - `WorkspaceService.addOrReplaceSchedule()`: Manages schedule periods

3. **Updated Components**
   - `HomeComponent`: Now calls `getAvailableWorkspaces()` to show only workspaces with availability
   - `WorkspaceDetailsComponent`: Displays room capacity, booked count, available seats, and weekly schedule table

## 🚀 Setup & Migration

### Prerequisites
- Stop any running API instance to unlock DLL files
- Ensure SQL Server is running (or use InMemory fallback)

### Step 1: Run Database Migration

```powershell
# Navigate to Infrastructure project
cd f:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Infrastructure

# Create migration
dotnet ef migrations add AddWorkspaceScheduling --startup-project ../CoworkBooking.Api/CoworkBooking.Api.csproj

# Apply migration to database
dotnet ef database update --startup-project ../CoworkBooking.Api/CoworkBooking.Api.csproj
```

### Step 2: Start Backend API

```powershell
cd f:\PrivateWork\WorkSpace\CoworkBooking\BackEnd\CoworkBooking.Api
dotnet run
```

- API runs on `https://localhost:5001` and `http://localhost:5000`
- Swagger UI available at root: `https://localhost:5001/`
- Database is migrated and seeded automatically on startup

### Step 3: Start Frontend

```powershell
cd f:\PrivateWork\WorkSpace\CoworkBooking\frontend\cowork-booking
npm start
```

- Angular dev server runs on `http://localhost:4200`

## 📊 API Examples

### Get Available Workspaces

```http
GET https://localhost:5001/api/workspaces/available
```

Returns workspaces with rooms that have `availableSeats > 0`.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Downtown Cowork Space",
    "description": "Cozy workspace in Cairo Downtown",
    "city": "Cairo",
    "rooms": [
      {
        "id": 1,
        "name": "Meeting Room A",
        "capacity": 6,
        "bookedCount": 1,
        "availableSeats": 5,
        "pricePerHour": 75.00
      }
    ]
  }
]
```

### Get Active Schedule

```http
GET https://localhost:5001/api/workspaces/1/schedule
```

Returns the schedule period active for today's date.

**Response:**
```json
{
  "id": 1,
  "workspaceId": 1,
  "startDate": "2025-01-01T00:00:00",
  "endDate": "2025-12-31T00:00:00",
  "schedules": [
    {
      "id": 1,
      "dayOfWeek": 0,
      "openTime": "09:00:00",
      "closeTime": "18:00:00",
      "isWeekend": false
    },
    ...
    {
      "id": 6,
      "dayOfWeek": 5,
      "openTime": null,
      "closeTime": null,
      "isWeekend": true
    }
  ]
}
```

### Add/Replace Schedule Period

```http
POST https://localhost:5001/api/workspaces/1/schedule
Content-Type: application/json

{
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "schedules": [
    {
      "dayOfWeek": 0,
      "openTime": "08:00:00",
      "closeTime": "17:00:00",
      "isWeekend": false
    },
    ...
  ]
}
```

Automatically removes overlapping periods before saving.

## 🎨 Frontend Features

### Home Page
- Displays only workspaces with available rooms
- Shows room count per workspace
- Click "View Details" to see full workspace info

### Workspace Details Page
- **Workspace Info**: Name, city, address, coordinates
- **Working Hours Schedule**: Weekly table showing open/close times per day
- **Available Rooms**: Cards displaying:
  - Room name
  - Total capacity
  - Booked count (in red)
  - Available seats (in green)
  - Devices list
  - "Book Room" button

## 🧪 Testing

### Backend Tests
1. **Availability Logic**: Book all seats in a room and verify it's excluded from `GET /api/workspaces/available`
2. **Schedule Overlap**: Add a new period overlapping an existing one and verify the old one is removed
3. **Active Period Query**: Test with date inside/outside period range

### Frontend Tests
1. Navigate to home and verify only available workspaces appear
2. Open workspace details and check schedule table displays correctly
3. Verify booked/available counts update after creating bookings

## 📁 Key Files Modified/Added

### Backend
- **Entities**: `Domain/Entities/WorkspaceSchedulePeriod.cs`, `WorkspaceSchedule.cs`
- **DbContext**: `Infrastructure/Data/AppDbContext.cs` (added DbSets, relationships)
- **DTOs**: `Application/DTOs/WorkspaceScheduleDto.cs`
- **Services**: `Application/Services/WorkspaceScheduleService.cs`, updated `WorkSpaceService.cs`
- **Controllers**: `Api/Controllers/WorkSpacesController.cs` (added schedule endpoints)
- **Seed**: `Infrastructure/Data/SeedData.cs` (schedule period + schedules)
- **DI**: `Api/Program.cs` (registered `IWorkspaceScheduleService`)

### Frontend
- **Models**: `core/models/workspace.model.ts` (added schedule types, booked/available fields)
- **Services**: `core/services/workspace.service.ts` (added schedule methods)
- **Components**: `features/home/home.component.ts`, `features/workspace-details/*`

## 🔧 Configuration

### appsettings.json
- `DatabaseSettings:UseInMemory`: Set `false` to use SQL Server, `true` for in-memory DB
- `ConnectionStrings:DefaultConnection`: SQL Server connection string

### environment.ts
- `apiBaseUrl`: Backend API URL (default: `https://localhost:5001/api`)

## 📝 Notes

- **Time-based periods**: When adding a new schedule period, any existing periods with overlapping date ranges are automatically removed
- **Real-time availability**: Booked/available counts are computed dynamically based on active bookings at the current moment
- **Weekend handling**: Schedule entries with `isWeekend: true` have null `openTime` and `closeTime`
- **DayOfWeek**: Uses .NET `DayOfWeek` enum (0 = Sunday, 6 = Saturday)

## 🐛 Troubleshooting

### Migration Fails
- **Error**: "Build failed"
  - **Solution**: Stop all running API instances, then re-run migration command

### No Workspaces Appear on Home
- **Check**: Are there rooms with `availableSeats > 0`?
- **Solution**: Reduce booking count or increase room capacity in seed data

### Schedule Not Showing
- **Check**: Is there an active period covering today's date?
- **Solution**: Update seed data or POST a new period via `/api/workspaces/{id}/schedule`

## 🎯 Next Steps (Optional Enhancements)

- Add "Next Available Room" indicator per workspace
- Implement schedule CRUD UI in admin panel
- Add booking conflict validation (prevent overbooking)
- Support custom time zones per workspace
- Add capacity alerts when rooms are near full
