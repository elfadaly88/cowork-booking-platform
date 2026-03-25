export interface Device {
  id?: number;
  name: string;
  extraCostPerHour: number;
  roomId?: number;
}

export interface Room {
  id?: number;
  name: string;
  capacity: number;
  bookedCount?: number;
  availableSeats?: number;
  pricePerHour: number;
  hasDevices?: boolean;
  workspaceId?: number;
  devices?: Device[];
}

export interface WorkspaceImage {
  id?: number;
  url: string;
  caption?: string;
  isMain: boolean;
  order: number;
}

export interface Workspace {
  id?: number;
  ownerId?: string;
  ownerName?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isApproved?: boolean;
  averageRating?: number;
  totalReviews?: number;
  rooms?: Room[];
  images?: WorkspaceImage[];
  mainImageUrl?: string;
  currentSchedulePeriod?: WorkspaceSchedulePeriod;
  distance?: number;
}

export interface WorkspaceSchedule {
  id?: number;
  dayOfWeek: number;
  openTime?: string; // TimeSpan as string "HH:mm:ss"
  closeTime?: string;
  isWeekend: boolean;
}

export interface WorkspaceSchedulePeriod {
  id?: number;
  workspaceId: number;
  startDate: string; // ISO date
  endDate: string;
  schedules: WorkspaceSchedule[];
}

export interface CreateWorkspaceDto {
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  rooms?: CreateRoomDto[];
}

export interface CreateRoomDto {
  name: string;
  capacity: number;
  pricePerHour: number;
  devices?: CreateDeviceDto[];
}

export interface CreateDeviceDto {
  name: string;
  extraCostPerHour: number;
}

export interface UpdateWorkspaceDto {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  rooms?: UpdateRoomDto[];
}

export interface UpdateRoomDto {
  id?: number;
  name: string;
  capacity: number;
  pricePerHour: number;
  devices?: UpdateDeviceDto[];
}

export interface UpdateDeviceDto {
  id?: number;
  name: string;
  extraCostPerHour: number;
}
