import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

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

  constructor(private commonService: CommonService) {}

  saveSettings(): void {
    this.commonService.success('Settings saved successfully.');
  }
}
