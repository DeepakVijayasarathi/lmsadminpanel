import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpGeneralService } from '../../services/http.service';
import { User, CreateUserPayload } from './users.model';
import { environment } from '../../../environments/environment';

const BASE_URL = environment.apiUrl;
const USERS_API = '/users';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpGeneralService<any>) {}

  getAll(): Observable<User[]> {
    return this.http.getData(BASE_URL, USERS_API);
  }

  getById(id: string): Observable<User> {
    return this.http.getData(BASE_URL, `${USERS_API}/${id}`);
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.http.postData(BASE_URL, USERS_API, payload);
  }

  update(id: string, payload: CreateUserPayload): Observable<User> {
    return this.http.putData(BASE_URL, `${USERS_API}/${id}`, payload) as Observable<User>;
  }

  delete(id: string): Observable<any> {
    return this.http.deleteData(BASE_URL, `${USERS_API}/${id}`);
  }

  getAllRoles(): Observable<User[]> {
    return this.http.getData(BASE_URL, '/role');
  }
}