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
  pricePerHour: number;
  hasDevices?: boolean;
  workspaceId?: number;
  devices?: Device[];
}

export interface Workspace {
  id?: number;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  rooms?: Room[];
}

export interface CreateWorkspaceDto {
  name: string;
  description: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
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
