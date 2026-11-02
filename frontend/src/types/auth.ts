export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PhoneOtpFormData {
  countryCode: string;
  phoneNumber: string;
  otp: string;
}

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  otp?: string;
  general?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  isBackendConnected?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  email_verified: boolean;
  created_at: string;
  last_login_at: string;
  auth_provider?: string;
  has_password?: boolean;
  role?: string;
  session_id?: string | null;
  session_expires_at?: string | null;
}

export interface ProfileUpdateData {
  name: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface DeleteAccountData {
  confirmText: string;
  password?: string;
}
