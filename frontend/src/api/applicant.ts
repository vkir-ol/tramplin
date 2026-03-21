// API функции для ЛК соискателя.

import api from './client';
import type {
  ApiResponse,
  ApplicantProfileResponse,
  UpdateApplicantRequest,
} from '../types';

// Получить свой профиль соискателя
export async function getApplicantProfile(): Promise<ApplicantProfileResponse> {
  const response = await api.get<ApiResponse<ApplicantProfileResponse>>(
    '/profile/applicant'
  );
  return response.data.data!;
}

// Обновить свой профиль соискателя
export async function updateApplicantProfile(
  data: UpdateApplicantRequest
): Promise<ApplicantProfileResponse> {
  const response = await api.put<ApiResponse<ApplicantProfileResponse>>(
    '/profile/applicant',
    data
  );
  return response.data.data!;
}