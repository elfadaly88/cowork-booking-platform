# Admin Panel User Guide

## Overview
The CoworkBooking admin panel allows you to manage workspaces, rooms, devices, and working schedules.

---

## Adding a New Workspace

### Step 1: Fill Basic Information
Navigate to `/admin` and fill in the workspace details:

1. **Name** *(required)* - The workspace name (min 3 characters)
2. **Description** *(required)* - A brief description of the workspace
3. **Full Address** *(required)* - Complete street address
4. **City** *(required)* - City name

### Step 2: Set Location on Map
- Click and drag the map marker to the exact workspace location
- The latitude and longitude will be automatically populated
- **Note**: Location coordinates are optional but recommended for map display

### Step 3: Add Rooms
Click **"Add Room"** to create a room:
- **Room Name** *(required)* - e.g., "Meeting Room A"
- **Capacity** *(required)* - Number of people (1-1000)
- **Price Per Hour** *(required)* - Hourly rate in EGP (minimum 0)

### Step 4: Add Devices (Optional)
For each room, you can add optional devices:
- Click **"Add Device"** under the room
- **Device Name** *(required)* - e.g., "Projector", "Whiteboard"
- **Extra Cost Per Hour** *(required)* - Additional hourly charge in EGP

### Step 5: Save
- Click **"Create Workspace"** button
- The button is disabled until all required fields are valid
- Success message will appear when saved

---

## Managing Workspace Schedules

### Access Schedule Management
From the admin panel header, click **"Manage Schedules"** or navigate to `/admin/schedule`

### Setting Up a Schedule

#### 1. Select Workspace
Choose the workspace from the dropdown menu

#### 2. Define Schedule Period
- **Start Date** - When the schedule begins (required)
- **End Date** - When the schedule ends (required)

#### 3. Configure Weekly Hours
For each day of the week:

**Working Days:**
- Set **Open Time** (e.g., 09:00)
- Set **Close Time** (e.g., 18:00)

**Weekends/Closed Days:**
- Check the **"Weekend"** checkbox
- Times will be automatically cleared

**Quick Actions:**
- Click **"Apply to All Weekdays"** to copy the first working day's hours to all weekdays

#### 4. Save Schedule
- Click **"Save Schedule"** button
- The schedule will be applied immediately
- You'll be redirected back to the admin panel

---

## Validation Rules

### Workspace Form
✅ **Name**: Required, minimum 3 characters
✅ **Description**: Required
✅ **Address**: Required
✅ **City**: Required
✅ **Latitude/Longitude**: Optional (auto-filled from map)

### Room Form
✅ **Name**: Required, minimum 2 characters
✅ **Capacity**: Required, 1-1000 people
✅ **Price Per Hour**: Required, minimum 0 EGP

### Device Form
✅ **Name**: Required, minimum 2 characters
✅ **Extra Cost Per Hour**: Required, minimum 0 EGP

### Schedule Form
✅ **Workspace**: Required
✅ **Start Date**: Required
✅ **End Date**: Required
✅ **Working Hours**: Required for non-weekend days

---

## Common Issues

### ❌ Save Button is Disabled

**Possible Causes:**
1. **Missing required fields** - Check for red error messages under inputs
2. **Invalid values** - Ensure numbers are within valid ranges
3. **Form not touched** - Click inside required fields to trigger validation
4. **Latitude/Longitude pattern issue** - Remove the validation by updating the form (already fixed in latest version)

**Solution:**
- Review all fields marked with red asterisk (*)
- Ensure all validation messages are cleared
- Try clicking in each field and tabbing out to trigger validation checks

### ❌ Location Not Showing
- Make sure you clicked on the map to set a location
- Latitude and longitude should be automatically populated
- These fields are now optional in the updated version

### ❌ Schedule Not Saving
- Ensure a workspace is selected
- Both start and end dates must be filled
- At least one working day should have open/close times
- Weekend days should have the "Weekend" checkbox checked

---

## Features Summary

### ✨ Enhanced Admin Panel (`/admin`)
- ✅ Create workspaces with rooms and devices in one go
- ✅ Edit existing workspaces
- ✅ Delete workspaces (cascades to rooms and devices)
- ✅ Interactive map picker for location
- ✅ Real-time form validation
- ✅ Professional gradient UI

### ✨ Schedule Management (`/admin/schedule`)
- ✅ Set working hours for each day of the week
- ✅ Mark weekends/closed days
- ✅ Define schedule periods with start/end dates
- ✅ Quick apply to all weekdays
- ✅ Load and edit existing schedules

### ✨ Simple Admin Panel (`/admin-simple`)
- ✅ Basic workspace creation without rooms
- ✅ Simpler interface for quick updates

---

## Tips for Best Results

1. **Plan Your Workspace Structure**
   - Decide on rooms and devices before creating
   - Have pricing ready

2. **Use Descriptive Names**
   - Clear room names help users choose
   - Describe devices accurately

3. **Set Realistic Schedules**
   - Consider holidays when setting end dates
   - Mark weekends appropriately for your region

4. **Test the Map Picker**
   - Zoom in for accurate placement
   - Verify coordinates look correct

5. **Review Before Saving**
   - Double-check all fields
   - Ensure pricing is correct
   - Validate working hours make sense

---

## API Endpoints Used

- `POST /api/workspaces/with-rooms` - Create workspace with rooms
- `PUT /api/workspaces/{id}/with-rooms` - Update workspace with rooms
- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/{id}` - Get workspace details
- `DELETE /api/workspaces/{id}` - Delete workspace
- `POST /api/workspaces/{id}/schedule` - Create/update schedule
- `GET /api/workspaces/{id}/schedule` - Get active schedule

---

## Need Help?

If you continue to experience issues:
1. Check browser console for errors (F12)
2. Verify the backend API is running
3. Ensure database migrations are applied
4. Check network tab for failed requests

**Database Migration Command:**
```bash
cd BackEnd/CoworkBooking.Api
dotnet ef database update
```
