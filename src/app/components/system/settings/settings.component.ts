import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { AppSettingService } from '../../../services/app-setting.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['../../../shared-page.css', './settings.component.css']
})
export class SettingsComponent implements OnInit {
  platformName = 'B2P Teachers';
  supportEmail = 'support@b2pteachers.com';
  timezone = 'Asia/Kolkata';
  language = 'English';
  maintenanceMode = false;
  allowRegistration = true;
  maxStudentsPerBatch = 50;

  isRecordingEnabled = false;
  togglingRecording  = false;

  constructor(
    private commonService: CommonService,
    private appSettingService: AppSettingService
  ) {}

  ngOnInit(): void {
    this.appSettingService.getByKey('IsRecordingEnabled').subscribe({
      next: (s) => { this.isRecordingEnabled = s.value === 'true'; },
      error: ()  => { this.isRecordingEnabled = false; }
    });
  }

  toggleRecording(): void {
    this.togglingRecording = true;
    this.appSettingService.toggleRecording().subscribe({
      next: () => {
        this.togglingRecording = false;
        this.isRecordingEnabled = !this.isRecordingEnabled;
        this.commonService.success(`Recording ${this.isRecordingEnabled ? 'enabled' : 'disabled'}.`);
      },
      error: () => {
        this.togglingRecording = false;
        this.commonService.error('Failed to toggle recording setting.');
      }
    });
  }

  saveSettings(): void {
    this.commonService.success('Settings saved successfully.');
  }
}
