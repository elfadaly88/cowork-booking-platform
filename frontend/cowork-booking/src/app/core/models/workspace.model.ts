export interface Device {
  id: number;
  name: string;
  type?: string;
}

export interface Room {
  id: number;
  name: string;
  capacity?: number;
  devices?: Device[];
}

export interface Workspace {
  id: number;
  name: string;
  city?: string;
  rooms?: Room[];
  devices?: Device[];
}
