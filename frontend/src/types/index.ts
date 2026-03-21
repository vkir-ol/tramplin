// Все TS-типы


export type UserRole = 'APPLICANT' | 'EMPLOYER' | 'CURATOR' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'BLOCKED';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';


export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
  role: 'APPLICANT' | 'EMPLOYER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  accessToken: string;
  refreshToken: string;
}

// Профиль соискателя

export interface ApplicantProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  university: string | null;
  course: number | null;
  graduationYear: number | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
}

export interface UpdateApplicantRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  university?: string;
  course?: number;
  graduationYear?: number;
  bio?: string;
  phone?: string;
}

// Профиль компании

export interface CompanyProfileResponse {
  userId: string;
  companyName: string;
  description: string | null;
  industry: string | null;
  inn: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  verificationStatus: VerificationStatus;
}

export interface UpdateCompanyRequest {
  companyName: string;
  description?: string;
  industry?: string;
  inn?: string;
  websiteUrl?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Единая обёртка API ответов

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}