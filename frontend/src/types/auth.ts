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
  full_name?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  picture?: string | null;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}
