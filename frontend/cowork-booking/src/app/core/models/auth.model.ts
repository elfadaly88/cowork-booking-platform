export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'User' | 'Owner';
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl?: string;
  roles: string[];
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}
