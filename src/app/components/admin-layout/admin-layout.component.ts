import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpGeneralService } from '../../services/http.service';
import { environment } from '../../../environments/environment';

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
  menus = [];

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
        { label: 'Courses',       icon: 'fa-solid fa-book-open',      route: '/courses'           },
        { label: 'Batches',       icon: 'fa-solid fa-layer-group',    route: '/batches'           },
        { label: 'Library',       icon: 'fa-solid fa-book-bookmark',  route: '/library'           },
        { label: 'Timetable',     icon: 'fa-solid fa-calendar-days',  route: '/timetable'         },
        { label: 'Session Slots', icon: 'fa-solid fa-calendar-check', route: '/session-slots'     },
        { label: 'My Meetings',   icon: 'fa-solid fa-circle-play',    route: '/my-meetings'       },
      ],
    },
    {
      groupLabel: 'Dashboards',
      items: [
        { label: 'Teacher Dashboard', icon: 'fa-solid fa-chalkboard-user', route: '/teacher-dashboard' },
        { label: 'Student Dashboard', icon: 'fa-solid fa-user-graduate',   route: '/student-dashboard' },
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
        { label: 'Menu',                icon: 'fa-solid fa-bars',        route: '/menu'     },
      ],
    },
  ];

  // In your component, add this icon mapping
  private iconMap: Record<string, string> = {
    'dashboard':   'fa-solid fa-gauge-high',
    'book':        'fa-solid fa-book-open',
    'courses':     'fa-solid fa-book-open',
    'students':    'fa-solid fa-user-graduate',
    'teachers':    'fa-solid fa-chalkboard-user',
    'parents':     'fa-solid fa-people-roof',
    'boards':      'fa-solid fa-building-columns',
    'classes':     'fa-solid fa-school',
    'subjects':    'fa-solid fa-atom',
    'topics':      'fa-solid fa-list-check',
    'batches':     'fa-solid fa-layer-group',
    'live-classes':'fa-solid fa-video',
    'library':     'fa-solid fa-book-bookmark',
    'timetable':   'fa-solid fa-calendar-days',
    'exams':       'fa-solid fa-file-pen',
    'results':     'fa-solid fa-file-circle-check',
    'notifications':'fa-solid fa-bell',
    'announcements':'fa-solid fa-bullhorn',
    'payments':    'fa-solid fa-indian-rupee-sign',
    'subscriptions':'fa-solid fa-id-card',
    'refunds':     'fa-solid fa-rotate-left',
    'attendance':  'fa-solid fa-user-check',
    'performance': 'fa-solid fa-chart-line',
    'revenue':     'fa-solid fa-chart-bar',
    'roles':       'fa-solid fa-user-shield',
    'settings':    'fa-solid fa-gear',
    'menu':        'fa-solid fa-bars',
    // fallback
    'default':     'fa-solid fa-circle-dot',
  };

  constructor(private router: Router, private authService: AuthService, private httpService: HttpGeneralService<any>) {
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
    // this.loadMenus();
  }

  private resolveIcon(iconKey: string, name: string): string {
    const key = (iconKey || name || '').toLowerCase().replace(/\s+/g, '-');
    return this.iconMap[key] ?? this.iconMap['default'];
  }

  loadMenus(): void {
    this.httpService.getData(environment.apiUrl, '/menu/get-user-access-menu').subscribe({
      next: (res: any) => {
        const flat: any[] = Array.isArray(res) ? res : (res?.data ?? []);

        // Separate parents (no parentId) and children
        const parents  = flat.filter(m => !m.parentId).sort((a, b) => a.sequence - b.sequence);
        const children = flat.filter(m =>  m.parentId);

        if (parents.length === 0) {
          // ── Flat list: no grouping possible, put everything in one group ──
          this.navGroups = [{
            groupLabel: 'Menu',
            items: flat
              .filter(m => m.isVisible && m.isActive)
              .sort((a, b) => a.sequence - b.sequence)
              .map(m => ({
                label: m.name,
                icon:  this.resolveIcon(m.icon, m.name),
                route: m.url,
              })),
          }];
          return;
        }

        // ── Hierarchical list: parents become groups, children become items ──
        this.navGroups = parents
          .filter(p => p.isVisible && p.isActive)
          .map(parent => {
            const groupChildren = children
              .filter(c => c.parentId === parent.id && c.isVisible && c.isActive)
              .sort((a, b) => a.sequence - b.sequence)
              .map(c => ({
                label: c.name,
                icon:  this.resolveIcon(c.icon, c.name),
                route: c.url,
              }));

            // If a parent has no children, treat it as a standalone nav item group
            return {
              groupLabel: parent.name,
              items: groupChildren.length
                ? groupChildren
                : [{
                    label: parent.name,
                    icon:  this.resolveIcon(parent.icon, parent.name),
                    route: parent.url,
                  }],
            };
          })
          // Optionally drop empty groups
          .filter(g => g.items.length > 0);
      },
      error: () => {},
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
