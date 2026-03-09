import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

interface MenuCategory {
  title: string;
  icon: string;
  expanded: boolean;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  sidebarCollapsed = false;
  isMobileView = false;
  currentRoute = '';

  dashboardItem: MenuItem = {
    label: 'Dashboard',
    icon: 'fa-solid fa-home',
    route: '/dashboard',
  };

  menuCategories: MenuCategory[] = [];

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  ngOnInit() {
    this.menuCategories = [
      {
        title: 'User Management',
        icon: 'fa-solid fa-user-group',
        expanded: true,
        items: [
          { label: 'Users', icon: 'fa-solid fa-user-plus', route: '/users' },
          {
            label: 'List of Users',
            icon: 'fa-solid fa-users-viewfinder',
            route: '/list-of-users',
          },
          {
            label: 'User Tracking',
            icon: 'fa-solid fa-location',
            route: '/user-tracking',
          },
          {
            label: 'Attendance',
            icon: 'fa-solid fa-user-check',
            route: '/attendance',
          },
        ],
      },
      {
        title: 'Utilities',
        icon: 'fa-solid fa-list-ul',
        expanded: true,
        items: [
          { label: 'Customer', icon: 'fa-solid fa-users', route: '/customers' },
          {
            label: 'Tasks',
            icon: 'fa-solid fa-clipboard-list',
            route: '/tasks',
          },
          {
            label: 'Expense',
            icon: 'fa-solid fa-indian-rupee-sign',
            route: '/expenses',
          },
          // { label: 'Notifications', icon: 'fa-solid fa-bell', route: '/notifications' },
        ],
      },
      {
        title: 'Masters',
        icon: 'fa-solid fa-gear',
        expanded: false,
        items: [
          { label: 'Roles', icon: 'fa-solid fa-user-shield', route: '/roles' },
          {
            label: 'Categories',
            icon: 'fa-solid fa-tags',
            route: '/categories',
          },
        ],
      },
      {
        title: 'Reports',
        icon: 'fa-solid fa-book-open',
        expanded: false,
        items: [
          {
            label: 'Attendance',
            icon: 'fa-solid fa-clock',
            route: '/attendance-report',
          },
          {
            label: 'Visits',
            icon: 'fa-solid fa-location-dot',
            route: '/visit-report',
          },
          // { label: 'Tasks', icon: 'fa-solid fa-bars-progress', route: '/task-report' },
          {
            label: 'Expenses',
            icon: 'fa-solid fa-money-bill',
            route: '/expense-report',
          },
          {
            label: 'Route Map',
            icon: 'fa-solid fa-route',
            route: '/route-report',
          },
        ],
      },
      {
        title: 'Settings',
        icon: 'fa-solid fa-gear',
        expanded: false,
        items: [
          {
            label: 'App Version',
            icon: 'fa-brands fa-google-play',
            route: '/app-version',
          },
        ],
      },
    ];

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth < 768; // Mobile breakpoint
  }

  navigateTo(route: string) {
    if (!route) return;
    this.router.navigate([route]);
  }

  toggleSidebar() {
    if (this.isMobileView) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  toggleCategory(category: MenuCategory) {
    category.expanded = !category.expanded;
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  logout() {
    this.authService.logout();
  }

  refreshComponent(): void {
    const currentUrl = this.router.url;

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
