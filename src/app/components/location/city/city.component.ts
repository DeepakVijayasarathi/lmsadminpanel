import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

export interface Country {
  countryId: number;
  countryName: string;
  isActive: boolean;
}

export interface StateEntry {
  stateId: number;
  stateName: string;
  countryId: number;
  isActive: boolean;
}

export interface CityEntry {
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCityPayload {
  cityName: string;
  stateId: number;
}

export interface UpdateCityPayload {
  cityName: string;
  stateId: number;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-city',
  standalone: false,
  templateUrl: './city.component.html',
  styleUrls: ['../../../shared-page.css', './city.component.css'],
})
export class CityComponent implements OnInit {
  cities: CityEntry[] = [];
  filteredCities: CityEntry[] = [];
  countries: Country[] = [];
  allStates: StateEntry[] = [];
  filteredStatesForSelect: StateEntry[] = [];

  filterCountryId: number | null = null;
  filterStateId: number | null = null;
  searchQuery = '';
  isLoading = false;

  modalMode: ModalMode = null;
  selectedCity: CityEntry | null = null;

  formName = '';
  formCountryId: number | null = null;
  formStateId: number | null = null;
  formIsActive = true;
  nameError = '';
  stateError = '';

  pageSize = 10;
  currentPage = 1;

  get pagedCities(): CityEntry[] {
    return this.filteredCities.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCities.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadAllStates();
    this.loadCities();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  loadCountries(): void {
    this.httpService.getData(BASE_URL, '/country').subscribe({
      next: (res: any) => {
        const all: Country[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.countries = all.filter((c) => c.isActive);
      },
    });
  }

  loadAllStates(): void {
    this.httpService.getData(BASE_URL, '/state').subscribe({
      next: (res: any) => {
        const all: StateEntry[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.allStates = all.filter((s) => s.isActive);
      },
    });
  }

  loadCities(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/city').subscribe({
      next: (res: any) => {
        this.cities = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load cities.');
        this.isLoading = false;
      },
    });
  }

  onCountryChange(): void {
    this.filteredStatesForSelect = this.filterCountryId
      ? this.allStates.filter((s) => s.countryId === Number(this.filterCountryId))
      : [];
    this.filterStateId = null;
    this.applyFilter();
  }

  onFormCountryChange(): void {
    this.formStateId = null;
    this.filteredStatesForSelect = this.formCountryId
      ? this.allStates.filter((s) => s.countryId === Number(this.formCountryId))
      : [];
  }

  createCity(): void {
    const payload: CreateCityPayload = {
      cityName: this.formName.trim(),
      stateId: this.formStateId!,
    };
    this.httpService.postData(BASE_URL, '/city', payload).subscribe({
      next: () => {
        this.commonService.success(`City "${payload.cityName}" created successfully.`);
        this.closeModal();
        this.loadCities();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create city.');
      },
    });
  }

  updateCity(): void {
    if (!this.selectedCity) return;
    const payload: UpdateCityPayload = {
      cityName: this.formName.trim(),
      stateId: this.formStateId!,
      isActive: this.formIsActive,
    };
    this.httpService.putData(BASE_URL, `/city/${this.selectedCity.cityId}`, payload).subscribe({
      next: () => {
        this.commonService.success(`City "${payload.cityName}" updated successfully.`);
        this.closeModal();
        this.loadCities();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to update city.');
      },
    });
  }

  deleteCity(): void {
    if (!this.selectedCity) return;
    this.httpService.deleteData(BASE_URL, `/city/${this.selectedCity.cityId}`).subscribe({
      next: () => {
        this.commonService.success(`City "${this.selectedCity!.cityName}" deactivated.`);
        this.closeModal();
        this.loadCities();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete city.');
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedCity = null;
    this.formName = '';
    this.formCountryId = null;
    this.formStateId = null;
    this.formIsActive = true;
    this.filteredStatesForSelect = [];
    this.nameError = '';
    this.stateError = '';
  }

  openEditModal(city: CityEntry): void {
    this.modalMode = 'edit';
    this.selectedCity = city;
    this.formName = city.cityName;
    this.formStateId = city.stateId;
    this.formIsActive = city.isActive;
    this.nameError = '';
    this.stateError = '';
    const state = this.allStates.find((s) => s.stateId === city.stateId);
    if (state) {
      this.formCountryId = state.countryId;
      this.filteredStatesForSelect = this.allStates.filter(
        (s) => s.countryId === state.countryId
      );
    }
  }

  openViewModal(city: CityEntry): void {
    this.modalMode = 'view';
    this.selectedCity = city;
  }

  openDeleteModal(city: CityEntry): void {
    this.modalMode = 'delete';
    this.selectedCity = city;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedCity = null;
    this.nameError = '';
    this.stateError = '';
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createCity();
    } else if (this.modalMode === 'edit') {
      this.updateCity();
    }
  }

  validateForm(): boolean {
    this.nameError = '';
    this.stateError = '';
    const trimmed = this.formName.trim();

    if (!trimmed) {
      this.nameError = 'City name is required.';
      return false;
    }
    if (!this.formStateId) {
      this.stateError = 'Please select a state.';
      return false;
    }
    const duplicate = this.cities.find(
      (c) =>
        c.cityName.toLowerCase() === trimmed.toLowerCase() &&
        c.stateId === this.formStateId &&
        c.cityId !== this.selectedCity?.cityId
    );
    if (duplicate) {
      this.nameError = 'A city with this name already exists in the selected state.';
      return false;
    }
    return true;
  }

  onFilterStateChange(): void {
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.cities];
    if (this.filterStateId) {
      result = result.filter((c) => c.stateId === Number(this.filterStateId));
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (c) =>
          c.cityName.toLowerCase().includes(q) ||
          c.stateName.toLowerCase().includes(q)
      );
    }
    this.filteredCities = result;
    this.currentPage = 1;
  }

  get filterStatesForDropdown(): StateEntry[] {
    if (!this.filterCountryId) return this.allStates;
    return this.allStates.filter((s) => s.countryId === Number(this.filterCountryId));
  }

  get activeCount(): number {
    return this.cities.filter((c) => c.isActive).length;
  }
}
