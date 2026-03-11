import {
  Component
} from '@angular/core';
import { HttpGeneralService } from '../../services/http.service';
import { CommonService } from '../../services/common.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor(
    private readonly httpService: HttpGeneralService<any>,
    private common: CommonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
  }
}
