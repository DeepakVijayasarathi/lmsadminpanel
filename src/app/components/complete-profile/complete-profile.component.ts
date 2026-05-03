import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { LocationService, LocationItem } from '../../services/location.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-complete-profile',
  standalone: false,
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.css'],
})
export class CompleteProfileComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  countries: LocationItem[] = [];
  states: LocationItem[] = [];
  cities: LocationItem[] = [];
  countriesLoading = false;
  statesLoading = false;
  citiesLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private studentService: StudentService,
    private locationService: LocationService,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName:    ['', [Validators.required, Validators.minLength(2)]],
      lastName:     ['', [Validators.required, Validators.minLength(2)]],
      phone:        ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,15}$/)]],
      gender:       ['', Validators.required],
      dateOfBirth:  ['', Validators.required],
      address:      ['', [Validators.required, Validators.minLength(5)]],
      countryId:    [null, Validators.required],
      stateId:      [null, Validators.required],
      cityId:       [null, Validators.required],
      parentName:   ['', Validators.required],
      relationship: ['', Validators.required],
      parentEmail:  ['', [Validators.required, Validators.email]],
      parentPhone:  ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,15}$/)]],
    });

    this.loadCountries();
  }

  async loadCountries() {
    this.countriesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCountries());
      this.countries = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.countries = [];
    }
    this.countriesLoading = false;
  }

  async onCountryChange(countryId: number | null) {
    this.states = [];
    this.cities = [];
    this.form.patchValue({ stateId: null, cityId: null });
    if (!countryId) return;
    this.statesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getStatesByCountry(countryId));
      this.states = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.states = [];
    }
    this.statesLoading = false;
  }

  async onStateChange(stateId: number | null) {
    this.cities = [];
    this.form.patchValue({ cityId: null });
    if (!stateId) return;
    this.citiesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCitiesByState(stateId));
      this.cities = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.cities = [];
    }
    this.citiesLoading = false;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      await firstValueFrom(this.studentService.updateUserProfile(this.form.value));
      localStorage.setItem('needsProfileCompletion', 'false');
      this.commonService.success('Profile completed! Welcome aboard.', 'Done');
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.commonService.error(
        e?.error?.message || 'Failed to save profile. Please try again.',
        'Error',
      );
    }
    this.isSubmitting = false;
  }

  countryChanged(): void {
    this.onCountryChange(this.form.get('countryId')?.value ?? null);
  }

  stateChanged(): void {
    this.onStateChange(this.form.get('stateId')?.value ?? null);
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return `${this.label(name)} is required`;
    if (ctrl.errors?.['minlength']) return `${this.label(name)} is too short`;
    if (ctrl.errors?.['email']) return 'Enter a valid email address';
    if (ctrl.errors?.['pattern']) return `${this.label(name)} format is invalid`;
    return 'Invalid value';
  }

  private label(name: string): string {
    const map: Record<string, string> = {
      firstName: 'First name', lastName: 'Last name', phone: 'Phone number',
      gender: 'Gender', dateOfBirth: 'Date of birth', address: 'Address',
      countryId: 'Country', stateId: 'State', cityId: 'City',
      parentName: 'Parent name', relationship: 'Relationship',
      parentEmail: 'Parent email', parentPhone: 'Parent phone',
    };
    return map[name] || name;
  }
}
