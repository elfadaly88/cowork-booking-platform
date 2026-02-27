export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface BookingRequest {
  roomId: number;
  startTime: string; // ISO format
  endTime: string;   // ISO format
  totalPrice: number;
  deviceIds?: number[];
}

export interface BookingResponse {
  id: number;
  userId?: string;
  userFullName?: string;
  userEmail?: string;

  roomId: number;
  roomName?: string;
  workspaceId?: number;
  workspaceName?: string;
  workspaceCity?: string;

  startTime: string;
  endTime: string;
  totalPrice: number;

  status: BookingStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface CancelBookingRequest {
  cancellationReason?: string;
}

