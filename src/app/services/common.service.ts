import { Injectable } from '@angular/core';
import { ToastrService as NgxToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor(private ngxToastr: NgxToastrService) {}

  private defaultConfig = {
    timeOut: 4000,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    progressBar: true,
  };

  success(message: string, title: string = 'Success'): void {
    this.ngxToastr.success(message, title, {
      ...this.defaultConfig,
      toastClass: 'ngx-toastr toast-custom toast-success',
    });
  }

  error(message: string, title: string = 'Error'): void {
    this.ngxToastr.error(message, title, {
      ...this.defaultConfig,
      timeOut: 5000,
      toastClass: 'ngx-toastr toast-custom toast-error',
    });
  }

  warning(message: string, title: string = 'Warning'): void {
    this.ngxToastr.warning(message, title, {
      ...this.defaultConfig,
      toastClass: 'ngx-toastr toast-custom toast-warning',
    });
  }

  info(message: string, title: string = 'Info'): void {
    this.ngxToastr.info(message, title, {
      ...this.defaultConfig,
      toastClass: 'ngx-toastr toast-custom toast-info',
    });
  }

  custom(message: string, title: string = '', cssClass: string = 'toast-custom'): void {
    this.ngxToastr.show(message, title, {
      ...this.defaultConfig,
      toastClass: `ngx-toastr ${cssClass}`,
    });
  }
}