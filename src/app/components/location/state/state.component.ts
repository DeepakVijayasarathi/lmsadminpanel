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
  countryName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStatePayload {
  stateName: string;
  countryId: number;
}

export interface UpdateStatePayload {
  stateName: string;
  countryId: number;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-state',
  standalone: false,
  templateUrl: './state.component.html',
  styleUrls: ['../../../shared-page.css', './state.component.css'],
})
export class StateComponent implements OnInit {
  states: StateEntry[] = [];
  filteredStates: StateEntry[] = [];
  countries: Country[] = [];
  filterCountryId: number | null = null;
  searchQuery = '';
  isLoading = false;

  modalMode: ModalMode = null;
  selectedState: StateEntry | null = null;

  formName = '';
  formCountryId: number | null = null;
  formIsActive = true;
  nameError = '';
  countryError = '';

  pageSize = 10;
  currentPage = 1;

  get pagedStates(): StateEntry[] {
    return this.filteredStates.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStates.length / this.pageSize);
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
    this.loadStates();
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
      error: () => this.commonService.error('Failed to load countries.'),
    });
  }

  loadStates(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/state').subscribe({
      next: (res: any) => {
        this.states = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load states.');
        this.isLoading = false;
      },
    });
  }

  createState(): void {
    const payload: CreateStatePayload = {
      stateName: this.formName.trim(),
      countryId: this.formCountryId!,
    };
    this.httpService.postData(BASE_URL, '/state', payload).subscribe({
      next: () => {
        this.commonService.success(`State "${payload.stateName}" created successfully.`);
        this.closeModal();
        this.loadStates();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create state.');
      },
    });
  }

  updateState(): void {
    if (!this.selectedState) return;
    const payload: UpdateStatePayload = {
      stateName: this.formName.trim(),
      countryId: this.formCountryId!,
      isActive: this.formIsActive,
    };
    this.httpService.putData(BASE_URL, `/state/${this.selectedState.stateId}`, payload).subscribe({
      next: () => {
        this.commonService.success(`State "${payload.stateName}" updated successfully.`);
        this.closeModal();
        this.loadStates();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to update state.');
      },
    });
  }

  deleteState(): void {
    if (!this.selectedState) return;
    this.httpService.deleteData(BASE_URL, `/state/${this.selectedState.stateId}`).subscribe({
      next: () => {
        this.commonService.success(`State "${this.selectedState!.stateName}" deactivated.`);
        this.closeModal();
        this.loadStates();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete state.');
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedState = null;
    this.formName = '';
    this.formCountryId = null;
    this.formIsActive = true;
    this.nameError = '';
    this.countryError = '';
  }

  openEditModal(state: StateEntry): void {
    this.modalMode = 'edit';
    this.selectedState = state;
    this.formName = state.stateName;
    this.formCountryId = state.countryId;
    this.formIsActive = state.isActive;
    this.nameError = '';
    this.countryError = '';
  }

  openViewModal(state: StateEntry): void {
    this.modalMode = 'view';
    this.selectedState = state;
  }

  openDeleteModal(state: StateEntry): void {
    this.modalMode = 'delete';
    this.selectedState = state;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedState = null;
    this.nameError = '';
    this.countryError = '';
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createState();
    } else if (this.modalMode === 'edit') {
      this.updateState();
    }
  }

  validateForm(): boolean {
    this.nameError = '';
    this.countryError = '';
    const trimmed = this.formName.trim();

    if (!trimmed) {
      this.nameError = 'State name is required.';
      return false;
    }
    if (!this.formCountryId) {
      this.countryError = 'Please select a country.';
      return false;
    }
    const duplicate = this.states.find(
      (s) =>
        s.stateName.toLowerCase() === trimmed.toLowerCase() &&
        s.countryId === this.formCountryId &&
        s.stateId !== this.selectedState?.stateId
    );
    if (duplicate) {
      this.nameError = 'A state with this name already exists in the selected country.';
      return false;
    }
    return true;
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  onSearch(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.states];
    if (this.filterCountryId) {
      result = result.filter((s) => s.countryId === Number(this.filterCountryId));
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) =>
          s.stateName.toLowerCase().includes(q) ||
          s.countryName.toLowerCase().includes(q)
      );
    }
    this.filteredStates = result;
    this.currentPage = 1;
  }

  get activeCount(): number {
    return this.states.filter((s) => s.isActive).length;
  }
}
