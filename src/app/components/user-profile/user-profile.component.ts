import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { LocationService, LocationItem } from '../../services/location.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit {
  profile: any = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;

  form!: FormGroup;

  countries: LocationItem[] = [];
  states: LocationItem[] = [];
  cities: LocationItem[] = [];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private locationService: LocationService,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadProfile();
    this.loadCountries();
  }

  private buildForm() {
    this.form = this.fb.group({
      firstName:    ['', [Validators.required, Validators.minLength(2)]],
      lastName:     ['', [Validators.required]],
      phone:        ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,15}$/)]],
      gender:       ['', Validators.required],
      address:      ['', Validators.required],
      countryId:    [null],
      stateId:      [null],
      cityId:       [null],
      parentName:   [''],
      relationship: [''],
      parentEmail:  ['', Validators.email],
      parentPhone:  [''],
    });
  }

  async loadProfile() {
    this.isLoading = true;
    try {
      const res: any = await firstValueFrom(this.studentService.getUserProfile());
      this.profile = res?.data || res;
      this.patchForm(this.profile);
      if (this.profile?.countryId) await this.onCountryChange(this.profile.countryId, false);
      if (this.profile?.stateId) await this.onStateChange(this.profile.stateId, false);
    } catch {
      this.commonService.error('Failed to load profile.', 'Error');
    }
    this.isLoading = false;
  }

  private patchForm(data: any) {
    if (!data) return;
    this.form.patchValue({
      firstName:    data.firstName            || '',
      lastName:     data.lastName             || '',
      phone:        data.phone                || '',
      gender:       data.gender               || '',
      address:      data.address              || '',
      countryId:    data.countryId            ?? null,
      stateId:      data.stateId              ?? null,
      cityId:       data.cityId               ?? null,
      parentName:   data.parentName           || '',
      relationship: data.parentRelationship   || '',
      parentEmail:  data.parentEmail          || '',
      parentPhone:  data.parentPhone          || '',
    });
  }

  get profileCompletion(): number {
    if (!this.profile) return 0;
    const fields = ['firstName', 'lastName', 'phone', 'gender', 'address',
                    'countryId', 'stateId', 'parentName', 'parentEmail', 'parentPhone'];
    const filled = fields.filter(f => {
      const v = (this.profile as any)[f];
      return v !== null && v !== undefined && v !== '';
    }).length;
    return Math.round((filled / fields.length) * 100);
  }

  get completionColor(): string {
    if (this.profileCompletion >= 100) return '#10b981';
    if (this.profileCompletion >= 60)  return '#f59e0b';
    return '#ef4444';
  }

  get roleLabel(): string {
    return this.profile?.roleDto?.name || this.profile?.roleName || 'Student';
  }

  async loadCountries() {
    try {
      const data = await firstValueFrom(this.locationService.getCountries());
      this.countries = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.countries = [];
    }
  }

  async onCountryChange(countryId: number | null, resetChildren = true) {
    if (resetChildren) {
      this.states = [];
      this.cities = [];
      this.form.patchValue({ stateId: null, cityId: null });
    }
    if (!countryId) return;
    try {
      const data = await firstValueFrom(this.locationService.getStatesByCountry(countryId));
      this.states = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.states = [];
    }
  }

  async onStateChange(stateId: number | null, resetChildren = true) {
    if (resetChildren) {
      this.cities = [];
      this.form.patchValue({ cityId: null });
    }
    if (!stateId) return;
    try {
      const data = await firstValueFrom(this.locationService.getCitiesByState(stateId));
      this.cities = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.cities = [];
    }
  }

  startEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.patchForm(this.profile);
  }

  async saveProfile() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    try {
      const f = this.form.value;
      const payload = {
        firstName:          f.firstName,
        lastName:           f.lastName,
        phone:              f.phone,
        roleId:             this.profile?.roleDto?.id ?? null,
        isActive:           this.profile?.isActive ?? true,
        isBlocked:          this.profile?.isBlocked ?? false,
        countryId:          f.countryId   ?? null,
        stateId:            f.stateId     ?? null,
        cityId:             f.cityId      ?? null,
        gender:             f.gender      || null,
        address:            f.address     || null,
        parentName:         f.parentName       || null,
        parentRelationship: f.relationship     || null,
        parentEmail:        f.parentEmail      || null,
        parentPhone:        f.parentPhone      || null,
      };
      await firstValueFrom(this.studentService.updateUserProfile(payload));
      await this.loadProfile();
      this.isEditing = false;
      this.commonService.success('Profile updated successfully!', 'Saved');
    } catch (e: any) {
      this.commonService.error(e?.error?.message || 'Update failed. Please try again.', 'Error');
    }
    this.isSaving = false;
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'This field is required';
    if (ctrl.errors?.['minlength']) return 'Too short';
    if (ctrl.errors?.['email']) return 'Invalid email';
    if (ctrl.errors?.['pattern']) return 'Invalid format';
    return 'Invalid value';
  }

  countryChanged(): void {
    this.onCountryChange(this.form.get('countryId')?.value ?? null);
  }

  stateChanged(): void {
    this.onStateChange(this.form.get('stateId')?.value ?? null);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  get displayName(): string {
    const f = this.profile?.firstName || '';
    const l = this.profile?.lastName  || '';
    return `${f} ${l}`.trim() || this.profile?.userName || 'Student';
  }

  get initials(): string {
    const f = this.profile?.firstName?.[0] || '';
    const l = this.profile?.lastName?.[0]  || '';
    return (f + l).toUpperCase() || 'S';
  }
}
