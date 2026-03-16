import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['../../../shared-page.css', './settings.component.css']
})
export class SettingsComponent {
  platformName = 'B2P Teachers';
  supportEmail = 'support@b2pteachers.com';
  timezone = 'Asia/Kolkata';
  language = 'English';
  maintenanceMode = false;
  allowRegistration = true;
  maxStudentsPerBatch = 50;

  saveSettings(): void {
    console.log('Settings saved:', {
      platformName: this.platformName,
      supportEmail: this.supportEmail,
      timezone: this.timezone,
      language: this.language,
      maintenanceMode: this.maintenanceMode,
      allowRegistration: this.allowRegistration,
      maxStudentsPerBatch: this.maxStudentsPerBatch
    });
  }
}
