import {
  Component
} from '@angular/core';
import { HttpGeneralService } from '../services/http.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
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
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
  }
}
