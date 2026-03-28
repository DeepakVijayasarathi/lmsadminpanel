import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, finalize, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

declare var $: any;

@Injectable()
export class HttpGeneralService<T> {
  data!: T;
  listOfData!: T[];
  login!: boolean;

  constructor(public httpClient: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getData(url: string, apiRoute: string, options?: any): Observable<any> {
    this.turnOnModal();
    return this.httpClient.get(url + apiRoute, { headers: this.getAuthHeaders(), }).pipe(
      map(
        (response) => {
          return response;
        },
        tap(
          (res: Response) => {},
          (err: any) => {
            this.turnOffModal();
          }
        )
      ),
      finalize(() => {
        this.turnOffModal();
      })
    );
  }

  postData(url: string, apiRoute: string, data: T, options?: any): Observable<any> {
    this.turnOnModal();
    const isFormData = data instanceof FormData;
    return this.httpClient.post(
      url + apiRoute,
      isFormData ? data : JSON.stringify(data),
      {
        headers: isFormData ? this.getFormDataHeaders() : this.getAuthHeaders()
      }
    ).pipe(
      map(
        (response) => {
          return response;
        },
        tap(
          (res: Response) => {},
          (err: any) => {
            this.turnOffModal();
          }
        )
      ),
      finalize(() => {
        this.turnOffModal();
      })
    );
  }

  putData(url: string, apiRoute: string, data: T) {
    const isFormData = data instanceof FormData;
    return this.httpClient.put(
      url + apiRoute,
      isFormData ? data : JSON.stringify(data),
      {
        headers: isFormData ? this.getFormDataHeaders() : this.getAuthHeaders()
      }
    ).pipe(
      map(
        (response) => {
          return response;
        },
        tap(
          (res: Response) => {},
          (err: any) => {
            this.turnOffModal();
          }
        )
      ),
      finalize(() => {
        this.turnOffModal();
      })
    );
  }

  deleteData(url: string, apiRoute: string, data?: T): Observable<any> {

    return this.httpClient.delete(url + apiRoute, { headers: this.getAuthHeaders(), }).pipe(
      map(
        (response) => {
          return response;
        },
        tap(
          (res: Response) => {},
          (err: any) => {
            this.turnOffModal();
          }
        )
      ),
      finalize(() => {
        this.turnOffModal();
      })
    );
  }


  patchData(url: string, apiRoute: string): Observable<any> {
    return this.httpClient.patch(url + apiRoute, { headers: this.getAuthHeaders(), }).pipe(
      map(
        (response) => {
          return response;
        },
        tap(
          (res: Response) => { },
          (err: any) => {
            this.turnOffModal();
          }
        )
      ),
      finalize(() => {
        this.turnOffModal();
      })
    );
  }

  public pendingRequests = 0;
  public showLoading = false;

  public turnOnModal() {
    this.pendingRequests++;
    if (!this.showLoading) {
      this.showLoading = true;
    }
    this.showLoading = true;
  }

  public turnOffModal() {
    this.pendingRequests--;
    if (this.pendingRequests <= 0) {
      if (this.showLoading) {
      }
      this.showLoading = false;
    }
  }
}
