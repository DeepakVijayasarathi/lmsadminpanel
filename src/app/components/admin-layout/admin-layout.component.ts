import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string | number;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = true;       // desktop: expanded vs icon-only
  mobileSidebarOpen = false; // mobile drawer
  isMobile = false;
  currentRoute = '';
  expandedGroups: Set<string> = new Set(['Users', 'Curriculum']);

  navGroups: NavGroup[] = [
    {
      groupLabel: 'Users',
      items: [
        { label: 'Students',  icon: 'fa-solid fa-user-graduate',    route: '/students' },
        { label: 'Teachers',  icon: 'fa-solid fa-chalkboard-user',  route: '/teachers' },
        { label: 'Parents',   icon: 'fa-solid fa-people-roof',      route: '/parents'  },
      ],
    },
    {
      groupLabel: 'Curriculum',
      items: [
        { label: 'Boards',    icon: 'fa-solid fa-building-columns', route: '/boards'   },
        { label: 'Classes',   icon: 'fa-solid fa-school',           route: '/classes'  },
        { label: 'Subjects',  icon: 'fa-solid fa-atom',             route: '/subjects' },
        { label: 'Topics',    icon: 'fa-solid fa-list-check',       route: '/topics'   },
      ],
    },
    {
      groupLabel: 'Learning',
      items: [
        { label: 'Courses',      icon: 'fa-solid fa-book-open',      route: '/courses'       },
        { label: 'Batches',      icon: 'fa-solid fa-layer-group',    route: '/batches'       },
        { label: 'Live Classes', icon: 'fa-solid fa-video',          route: '/live-classes'  },
        { label: 'Library',      icon: 'fa-solid fa-book-bookmark',  route: '/library'       },
      ],
    },
    {
      groupLabel: 'Assessment',
      items: [
        { label: 'Exams & Quizzes', icon: 'fa-solid fa-file-pen',         route: '/exams'   },
        { label: 'Results',         icon: 'fa-solid fa-file-circle-check', route: '/results' },
      ],
    },
    {
      groupLabel: 'Communication',
      items: [
        { label: 'Notifications', icon: 'fa-solid fa-bell',       route: '/notifications', badge: 5 },
        { label: 'Announcements', icon: 'fa-solid fa-bullhorn',   route: '/announcements'           },
      ],
    },
    {
      groupLabel: 'Finance',
      items: [
        { label: 'Payments',      icon: 'fa-solid fa-indian-rupee-sign', route: '/payments'      },
        { label: 'Subscriptions', icon: 'fa-solid fa-id-card',          route: '/subscriptions' },
        { label: 'Refunds',       icon: 'fa-solid fa-rotate-left',      route: '/refunds', badge: 12 },
      ],
    },
    {
      groupLabel: 'Reports',
      items: [
        { label: 'Attendance',  icon: 'fa-solid fa-user-check',      route: '/attendance-report' },
        { label: 'Performance', icon: 'fa-solid fa-chart-line',      route: '/performance-report'},
        { label: 'Revenue',     icon: 'fa-solid fa-chart-bar',       route: '/revenue-report'    },
      ],
    },
    {
      groupLabel: 'System',
      items: [
        { label: 'Roles & Permissions', icon: 'fa-solid fa-user-shield', route: '/roles'    },
        { label: 'Settings',            icon: 'fa-solid fa-gear',        route: '/settings' },
      ],
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
        if (this.isMobile) this.mobileSidebarOpen = false;
      }
    });
  }

  ngOnInit(): void {
    this.checkViewport();
    // Auto-expand group containing active route
    this.navGroups.forEach(g => {
      if (g.items.some(i => i.route === this.currentRoute)) {
        this.expandedGroups.add(g.groupLabel);
      }
    });
  }

  ngOnDestroy(): void {}

  @HostListener('window:resize')
  checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.mobileSidebarOpen = false;
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  toggleGroup(label: string): void {
    if (this.expandedGroups.has(label)) {
      this.expandedGroups.delete(label);
    } else {
      this.expandedGroups.add(label);
    }
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups.has(label);
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }

  refreshComponent(): void {
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([url]);
    });
  }

  get activeLabel(): string {
    if (this.currentRoute === '/dashboard') return 'Dashboard';
    for (const g of this.navGroups) {
      const found = g.items.find(i => i.route === this.currentRoute);
      if (found) return found.label;
    }
    return 'Admin Panel';
  }
}
