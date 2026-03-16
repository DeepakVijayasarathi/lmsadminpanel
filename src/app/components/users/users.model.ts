export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userType: string;
  roleId: string;
}

export interface UpdateUserPayload extends CreateUserPayload {
  id: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
}

export const USER_TYPES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
  { value: 'moderator', label: 'Moderator' },
];