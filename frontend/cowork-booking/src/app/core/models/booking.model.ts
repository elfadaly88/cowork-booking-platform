export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
}

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
  paymentMethodId?: number;
  paymentMethodName?: string;
  paymentStatus?: PaymentStatus;

  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface CancelBookingRequest {
  cancellationReason?: string;
}

