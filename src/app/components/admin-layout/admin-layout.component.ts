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
  sidebarOpen = true;
  mobileSidebarOpen = false;
  isMobile = false;
  currentRoute = '';
  expandedGroups: Set<string> = new Set(['Users', 'Curriculum']);
  menus = [];

  navGroups: NavGroup[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private httpService: HttpGeneralService<any>,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
        if (this.isMobile) this.mobileSidebarOpen = false;
      }
    });
  }

  ngOnInit(): void {
    this.checkViewport();
    this.navGroups.forEach((g) => {
      if (g.items.some((i) => i.route === this.currentRoute)) {
        this.expandedGroups.add(g.groupLabel);
      }
    });
    this.loadMenus();
  }

  ngOnDestroy(): void {}

  @HostListener('window:resize')
  checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.mobileSidebarOpen = false;
  }

  loadMenus(): void {
    this.httpService
      .getData(environment.apiUrl, '/menu/get-user-access-menu')
      .subscribe({
        next: (res: any) => {
          const flat: any[] = Array.isArray(res) ? res : (res?.data ?? []);

          const parents = flat
            .filter((m) => !m.parentId)
            .sort((a, b) => a.sequence - b.sequence);
          const children = flat.filter((m) => m.parentId);

          if (parents.length === 0) {
            this.navGroups = [
              {
                groupLabel: 'Menu',
                items: flat
                  .filter((m) => m.isVisible && m.isActive)
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((m) => ({
                    label: m.name,
                    icon: m.icon,
                    route: m.url,
                  })),
              },
            ];
            return;
          }

          this.navGroups = parents
            .filter((p) => p.isVisible && p.isActive)
            .map((parent) => {
              const groupChildren = children
                .filter(
                  (c) => c.parentId === parent.id && !c.isVisible && c.isActive,
                )
                .sort((a, b) => a.sequence - b.sequence)
                .map((c) => ({
                  label: c.name,
                  icon: c.icon,
                  route: c.url,
                }));

              return {
                groupLabel: parent.name,
                items: groupChildren,
              };
            })
            .filter((g) => g.items.length > 0);
        },
        error: () => {},
      });
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
      const found = g.items.find((i) => i.route === this.currentRoute);
      if (found) return found.label;
    }
    return 'Admin Panel';
  }
}
