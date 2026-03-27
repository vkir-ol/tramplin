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





// КАРТОЧКИ ВОЗМОЖНОСТЕЙ

/*

Каждый тип влияет на отображение карточки
  VACANCY     - обычная вакансия
  INTERNSHIP  - стажировка
  MENTORSHIP  - менторская программа
  EVENT       - карьерное мероприятие(хакатоны, бауманкоды, фонкоды и тд)

*/

export enum OpportunityType {
  VACANCY = 'VACANCY',
  INTERNSHIP = 'INTERNSHIP',
  MENTORSHIP = 'MENTORSHIP',
  EVENT = 'EVENT',
}

/*

ФОРМАТ РАБОТЫ

  OFFICE - маркер на карте по точному адресу 
  HYBRID - маркер на карте по адресу офиса
  REMOTE - маркер по городу работодателя

*/

export enum WorkFormat {
  OFFICE = 'OFFICE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}





/*

СТАТУСЫ КАРТОЧЕК ВОЗМОЖНОСТЕЙ

  DRAFT               - черновик 
  ACTIVE              - опубликована и видна всем
  CLOSED              - закрыта работодателем
  REJECTED            - отклонена куратором
  PENDING_MODERATION  - на модерации

*/

export enum OpportunityStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ON_MODERATION = 'ON_MODERATION',
}


export enum TagCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  LEVEL = 'LEVEL',
  SPECIALIZATION = 'SPECIALIZATION',
  EMPLOYMENT_TYPE = 'EMPLOYMENT_TYPE',
  TOOL = 'TOOL',
  DATABASE = 'DATABASE',
}


export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
  approved: boolean;
  parentId: string | null;
  parentName: string | null;
}


export interface TagTreeResponse {
  id: string;
  name: string;
  category: TagCategory;
  children: TagTreeResponse[];
}


export interface OfferTagRequest {
  name: string;
  category: TagCategory;
  parentId?: string;
}



export interface CompanySummary {
  id: string;
  companyName: string;
  logoUrl: string | null;
  industry: string | null;
  city: string | null;
}


// ПОЛНАЯ КАРТОЧКА ВОЗМОЖНОСТИ

export interface OpportunityResponse {
  id: string;
  title: string;                // название мероприятия
  description: string;          // описание
  type: OpportunityType;        // тип(перечесления выше)
  workFormat: WorkFormat;       // офис/гибрид/удаленка
  status: OpportunityStatus;    // статус

  // Месторасположение
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  salaryMin: number | null;
  salaryMax: number | null;

  publishedAt: string | null;
  expiresAt: string | null;
  eventDate: string | null;


  contactEmail: string | null;
  contactPhone: string | null;
  contactUrl: string | null;    // ссылка на возможный сайт компании

  employerId: string;
  companyName: string;
  logoUrl: string | null;

  tags: string[]; // массив имен тегов

}



/* 
Короткая версия карточки для маркера на карте
Отобразится контент при наведении на маркер
*/

export interface OpportunityMapCard {
  id: string;
  title: string;
  companyName: string;
  logoUrl: string | null;
  type: OpportunityType;
  workFormat: WorkFormat;
  city: string;
  latitude: number | null;
  longitude: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
}



// Запрос на создание/редактирование карточки (POST /opportunities / PUT /opportunities)

export interface OpportunityRequest {
  title: string;
  type: OpportunityType;
  workFormat: WorkFormat;
  description: string;
  city: string;
  address?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  eventDate?: string | null;
  expiresAt?: string | null;
  tagIds?: string[];
  contactPhone?: string | null;
  contactEmail: string | null;
  contactUrl?: string | null; 
}


export interface PaginatedResponse<T> {
  content: T[];           // массив элементов текущей страницы
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}


export interface OpportunityFilters {
  type?: OpportunityType;
  workFormat?: WorkFormat;
  city?: string;
  salaryMin?: number;
  tagIds?: string[];
  page?: number;
  size?: number;
  search?: string;  // поиск по названию или описанию
}


// Отклики
export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESERVED = 'RESERVED',
}


export interface ApplicationResponse {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;

  // для соискателя, что за вакансия
  opportunityId: string;
  opportunityTitle: string;
  companyName: string;

  // для работодателя, кто откликнулся
  applicantId: string;
  applicantFirstName: string;
  applicantLastName:string;
  applicantEmail: string;
}


export interface CreateApplicationRequest {
  opportunityId: string;
  coverLetter?: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}


//Контакты
export enum ContactRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}


export interface ContactRequestResponse {
  id: string;
  senderId: string;
  senderDisplayName: string;
  senderEmail: string;
  status: ContactRequestStatus;
  createdAt: string;
}

export interface ContactResponse {
  contactRequestId: string;
  userId: string;
  displayName: string;
  email: string;
  connectedAt: string;
}


export interface FavoriteResponse {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  companyName: string;
  createdAt: string;
}