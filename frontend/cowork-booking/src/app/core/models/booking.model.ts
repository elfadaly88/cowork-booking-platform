export interface BookingRequest {
  roomId: number;
  userId?: number;
  startTime: string; // ISO format
  endTime: string;   // ISO format
  deviceIds?: number[];
}

export interface BookingResponse {
  id: number;
  roomId: number;
  userId?: number;
  startTime: string;
  endTime: string;
  status?: string;
}
