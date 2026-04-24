import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LocationItem {
  id: number;
  name: string;
}

export interface CountryDto {
  countryId: number;
  countryName: string;
  isActive: boolean;
  createdAt: string;
}

export interface StateDto {
  stateId: number;
  stateName: string;
  countryId: number;
  countryName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CityDto {
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all active countries
   */
  getCountries(): Observable<CountryDto[]> {
    return this.http.get<CountryDto[]>(`${this.API}/country`);
  }

  /**
   * Get all active states for a specific country
   */
  getStatesByCountry(countryId: number): Observable<StateDto[]> {
    return this.http.get<StateDto[]>(`${this.API}/state/by-country/${countryId}`);
  }

  /**
   * Get all active cities for a specific state
   */
  getCitiesByState(stateId: number): Observable<CityDto[]> {
    return this.http.get<CityDto[]>(`${this.API}/city/by-state/${stateId}`);
  }

  /**
   * Transform API response to simple dropdown format
   */
  // transformToDropdownFormat(items: any[]): LocationItem[] {
  //   if (!items || items.length === 0) return [];

  //   return items.map((item: any) => {
  //     let id = 0;
  //     let name = '';

  //     if (item.countryId !== undefined) {
  //       id = item.countryId;
  //       name = item.countryName;
  //     } else if (item.stateId !== undefined) {
  //       id = item.stateId;
  //       name = item.stateName;
  //     } else if (item.cityId !== undefined) {
  //       id = item.cityId;
  //       name = item.cityName;
  //     }

  //     return { id, name };
  //   });
  // }
  transformToDropdownFormat(items: any[]): LocationItem[] {
    if (!items || items.length === 0) return [];

    return items.map((item: any) => {
      let id = 0;
      let name = '';

      if (item.cityId !== undefined) {
        id = item.cityId;
        name = item.cityName;
      } else if (item.stateId !== undefined) {
        id = item.stateId;
        name = item.stateName;
      } else if (item.countryId !== undefined) {
        id = item.countryId;
        name = item.countryName;
      }

      return { id, name };
    });
  }
}
