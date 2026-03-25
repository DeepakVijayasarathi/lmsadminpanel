import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpGeneralService } from '../../services/http.service';
import { environment } from '../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface User {
  isApproved: boolean;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  isActive: boolean;
  roleDto: Role;
  createdAt?: string;
}

export interface UserPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId?: string;
}

export interface UserUpdatePayload extends UserPayload {
  isActive: boolean;
}

export interface BlockPayload {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private http: HttpGeneralService<any>) {}

  getUsers(): Observable<any> {
    return this.http.getData(BASE_URL, '/users');
  }

  getRoles(): Observable<any> {
    return this.http.getData(BASE_URL, '/role');
  }

  createUser(payload: UserPayload): Observable<any> {
    return this.http.postData(BASE_URL, '/users', payload);
  }

  updateUser(id: string, payload: UserUpdatePayload): Observable<any> {
    return this.http.putData(BASE_URL, `/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.deleteData(BASE_URL, `/users/${id}`);
  }

  blockUser(id: string, payload: BlockPayload): Observable<any> {
    return this.http.postData(BASE_URL, `/users/${id}/block`, payload);
  }

  deviceReset(id: string): Observable<any> {
    return this.http.postData(BASE_URL, `/users/${id}/device-reset`, {});
  }

  getInitials(firstName: string, lastName: string): string {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }

  getFullName(user: User): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  getStudents(): Observable<any> {
    return this.http.getData(BASE_URL, '/batches/students');
  }

  getTeachers(): Observable<any> {
    return this.http.getData(BASE_URL, '/batches/teachers');
  }

  getParents(): Observable<any> {
    return this.http.getData(BASE_URL, '/batches/parents');
  }

  approveTeacher(teacherId: string): Observable<any> {
    return this.http.postData(BASE_URL, `/users/approve-teacher/${teacherId}`, {});
  }

  rejectTeacher(teacherId: string): Observable<any> {
    return this.http.postData(BASE_URL, `/users/reject-teacher/${teacherId}`, {});
  }
}
