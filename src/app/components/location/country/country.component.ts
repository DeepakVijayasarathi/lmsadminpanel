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
  createdAt: string;
}

export interface CreateCountryPayload {
  countryName: string;
}

export interface UpdateCountryPayload {
  countryName: string;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-country',
  standalone: false,
  templateUrl: './country.component.html',
  styleUrls: ['../../../shared-page.css', './country.component.css'],
})
export class CountryComponent implements OnInit {
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  searchQuery = '';
  isLoading = false;

  modalMode: ModalMode = null;
  selectedCountry: Country | null = null;

  formName = '';
  formIsActive = true;
  nameError = '';

  pageSize = 10;
  currentPage = 1;

  get pagedCountries(): Country[] {
    return this.filteredCountries.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCountries.length / this.pageSize);
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
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  loadCountries(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/country').subscribe({
      next: (res: any) => {
        this.countries = Array.isArray(res) ? res : (res?.data ?? []);
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load countries.');
        this.isLoading = false;
      },
    });
  }

  createCountry(): void {
    const payload: CreateCountryPayload = { countryName: this.formName.trim() };
    this.httpService.postData(BASE_URL, '/country', payload).subscribe({
      next: () => {
        this.commonService.success(`Country "${payload.countryName}" created successfully.`);
        this.closeModal();
        this.loadCountries();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create country.');
      },
    });
  }

  updateCountry(): void {
    if (!this.selectedCountry) return;
    const payload: UpdateCountryPayload = {
      countryName: this.formName.trim(),
      isActive: this.formIsActive,
    };
    this.httpService.putData(BASE_URL, `/country/${this.selectedCountry.countryId}`, payload).subscribe({
      next: () => {
        this.commonService.success(`Country "${payload.countryName}" updated successfully.`);
        this.closeModal();
        this.loadCountries();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to update country.');
      },
    });
  }

  deleteCountry(): void {
    if (!this.selectedCountry) return;
    this.httpService.deleteData(BASE_URL, `/country/${this.selectedCountry.countryId}`).subscribe({
      next: () => {
        this.commonService.success(`Country "${this.selectedCountry!.countryName}" deactivated.`);
        this.closeModal();
        this.loadCountries();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete country.');
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedCountry = null;
    this.formName = '';
    this.formIsActive = true;
    this.nameError = '';
  }

  openEditModal(country: Country): void {
    this.modalMode = 'edit';
    this.selectedCountry = country;
    this.formName = country.countryName;
    this.formIsActive = country.isActive;
    this.nameError = '';
  }

  openViewModal(country: Country): void {
    this.modalMode = 'view';
    this.selectedCountry = country;
  }

  openDeleteModal(country: Country): void {
    this.modalMode = 'delete';
    this.selectedCountry = country;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedCountry = null;
    this.nameError = '';
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createCountry();
    } else if (this.modalMode === 'edit') {
      this.updateCountry();
    }
  }

  validateForm(): boolean {
    this.nameError = '';
    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.nameError = 'Country name is required.';
      return false;
    }
    const duplicate = this.countries.find(
      (c) =>
        c.countryName.toLowerCase() === trimmed.toLowerCase() &&
        c.countryId !== this.selectedCountry?.countryId
    );
    if (duplicate) {
      this.nameError = 'A country with this name already exists.';
      return false;
    }
    return true;
  }

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredCountries = q
      ? this.countries.filter((c) => c.countryName.toLowerCase().includes(q))
      : [...this.countries];
    this.currentPage = 1;
  }

  get activeCount(): number {
    return this.countries.filter((c) => c.isActive).length;
  }
}
