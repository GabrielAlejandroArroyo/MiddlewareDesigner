import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RuntimeService, AppRuntimeConfig, MenuItem, RuntimeModule } from '../../core/services/runtime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ModuleViewerComponent } from '../module-viewer/module-viewer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ModuleViewerComponent],
  template: `
    <div class="d-flex vh-100 overflow-hidden" *ngIf="runtimeConfig">
      <!-- Sidebar -->
      <aside class="sidebar bg-dark text-white d-flex flex-column" [class.collapsed]="isCollapsed">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
          <div class="d-flex align-items-center gap-2 overflow-hidden" *ngIf="!isCollapsed">
            <div class="bg-info rounded-circle flex-shrink-0" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="bi bi-app-indicator text-dark small"></i>
            </div>
            <span class="fw-bold text-nowrap">{{ runtimeConfig.app_nombre }}</span>
          </div>
          <button class="btn btn-dark btn-sm rounded-circle border-0" (click)="isCollapsed = !isCollapsed">
            <i class="bi" [class.bi-list]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
          </button>
        </div>

        <nav class="flex-grow-1 py-3 px-2 overflow-auto">
          <ul class="nav flex-column gap-1">
            <ng-container *ngFor="let item of runtimeConfig.menu_structure">
              <!-- Parent item con hijos -->
              <li class="nav-item" *ngIf="item.children && item.children.length > 0">
                <a class="nav-link d-flex align-items-center rounded-3 p-3 text-white menu-link"
                   (click)="item._expanded = !item._expanded"
                   [title]="isCollapsed ? item.label : ''">
                  <i [class]="'bi ' + item.icon + ' fs-5'" [class.me-3]="!isCollapsed"></i>
                  <span class="text-nowrap flex-grow-1" *ngIf="!isCollapsed">{{ item.label }}</span>
                  <i class="bi small" *ngIf="!isCollapsed"
                     [class.bi-chevron-down]="item._expanded" [class.bi-chevron-right]="!item._expanded"></i>
                </a>
                <ul class="nav flex-column ms-3" *ngIf="item._expanded && !isCollapsed">
                  <li class="nav-item" *ngFor="let child of item.children">
                    <a class="nav-link d-flex align-items-center rounded-3 py-2 px-3 text-white menu-link"
                       [class.active-item]="isActiveItem(child)"
                       (click)="onMenuClick(child)">
                      <i [class]="'bi ' + child.icon + ' small'" [class.me-2]="!isCollapsed"></i>
                      <span class="small">{{ child.label }}</span>
                    </a>
                  </li>
                </ul>
              </li>

              <!-- Item sin hijos (leaf) -->
              <li class="nav-item" *ngIf="!item.children || item.children.length === 0">
                <a class="nav-link d-flex align-items-center rounded-3 p-3 text-white menu-link"
                   [class.active-item]="isActiveItem(item)"
                   (click)="onMenuClick(item)"
                   [title]="isCollapsed ? item.label : ''">
                  <i [class]="'bi ' + item.icon + ' fs-5'" [class.me-3]="!isCollapsed"></i>
                  <span class="text-nowrap" *ngIf="!isCollapsed">{{ item.label }}</span>
                </a>
              </li>
            </ng-container>
          </ul>
        </nav>

        <div class="p-3 border-top border-secondary border-opacity-25" *ngIf="!isCollapsed">
          <div class="small text-muted mb-2">
            <i class="bi bi-person me-1"></i>{{ authService.username() }}
            <br><span class="x-small">Rol: {{ runtimeConfig.role_nombre }}</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light flex-grow-1" (click)="themeService.toggleTheme()">
              <i class="bi" [class.bi-moon-stars-fill]="themeService.currentTheme() === 'light'"
                 [class.bi-sun-fill]="themeService.currentTheme() === 'dark'"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger flex-grow-1" (click)="logout()">
              <i class="bi bi-box-arrow-right me-1"></i> Salir
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-grow-1 overflow-auto" style="background:var(--rt-bg-secondary)">
        <div *ngIf="!activeModule" class="d-flex align-items-center justify-content-center h-100">
          <div class="text-center">
            <i class="bi bi-hand-index-thumb display-1 text-muted"></i>
            <h4 class="mt-3 text-muted">Selecciona una opción del menú</h4>
            <p class="text-muted">{{ runtimeConfig.app_nombre }}</p>
          </div>
        </div>

        <app-module-viewer *ngIf="activeModule"
          [module]="activeModule"
          [allModules]="runtimeConfig.modules">
        </app-module-viewer>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="d-flex align-items-center justify-content-center vh-100">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3"></div>
        <p class="text-muted">Cargando aplicación...</p>
      </div>
    </div>

    <!-- Error -->
    <div *ngIf="errorMsg && !loading" class="d-flex align-items-center justify-content-center vh-100">
      <div class="text-center">
        <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
        <h4 class="mt-3">Error</h4>
        <p class="text-muted">{{ errorMsg }}</p>
        <button class="btn btn-primary" (click)="retry()">Reintentar</button>
      </div>
    </div>

    <style>
      .sidebar { width: 280px; min-width: 280px; transition: all 0.3s ease; background-color: var(--rt-sidebar-bg, #212529) !important; }
      .sidebar.collapsed { width: 70px; min-width: 70px; }
      .sidebar.collapsed .nav-link { justify-content: center; padding: 0.8rem !important; }
      .menu-link { opacity: 0.8; cursor: pointer; transition: all 0.2s; text-decoration: none; }
      .menu-link:hover { opacity: 1; background: rgba(255,255,255,0.1); }
      .active-item { opacity: 1 !important; background: rgba(13,110,253,0.2) !important; border-left: 3px solid #0d6efd; }
      .x-small { font-size: 0.75rem; }
    </style>
  `
})
export class ShellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private runtimeService = inject(RuntimeService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  runtimeConfig: (AppRuntimeConfig & { menu_structure: (MenuItem & { _expanded?: boolean })[] }) | null = null;
  activeModule: RuntimeModule | null = null;
  isCollapsed = false;
  loading = true;
  errorMsg = '';

  private slug = '';
  private appId = 0;

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.slug) {
      this.errorMsg = 'No se especificó una aplicación';
      this.loading = false;
      return;
    }
    this.loadApp();
  }

  private loadApp() {
    this.loading = true;
    this.errorMsg = '';

    this.runtimeService.getAppBySlug(this.slug).subscribe({
      next: (app) => {
        this.appId = app.id;
        this.resolveUserRole(app);
      },
      error: () => {
        this.errorMsg = `Aplicación "${this.slug}" no encontrada`;
        this.loading = false;
      }
    });
  }

  private resolveUserRole(app: any) {
    const usuarioId = this.authService.usuarioId();
    if (!usuarioId) {
      if (app.roles?.length > 0) {
        this.loadRuntime(app.roles[0].id_role);
      } else {
        this.errorMsg = 'La aplicación no tiene roles configurados';
        this.loading = false;
      }
      return;
    }

    this.runtimeService.getUserRoles(usuarioId).subscribe({
      next: (userRoles) => {
        const appRoleIds = new Set((app.roles || []).map((r: any) => r.id_role));
        const matchedRole = userRoles.find((ur: any) => !ur.baja_logica && appRoleIds.has(ur.id_rol));

        if (matchedRole) {
          this.loadRuntime(matchedRole.id_rol);
        } else if (app.roles?.length > 0) {
          this.loadRuntime(app.roles[0].id_role);
        } else {
          this.errorMsg = 'No tienes un rol asignado en esta aplicación';
          this.loading = false;
        }
      },
      error: () => {
        if (app.roles?.length > 0) {
          this.loadRuntime(app.roles[0].id_role);
        } else {
          this.errorMsg = 'Error al verificar roles del usuario';
          this.loading = false;
        }
      }
    });
  }

  private loadRuntime(roleId: string) {
    this.runtimeService.getAppRuntime(this.appId, roleId).subscribe({
      next: (config) => {
        this.runtimeConfig = {
          ...config,
          menu_structure: config.menu_structure.map(item => ({ ...item, _expanded: false })),
        };
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al cargar la configuración de la aplicación';
        this.loading = false;
      }
    });
  }

  onMenuClick(item: MenuItem) {
    if (!item.target_service_id || !item.target_endpoint_path) return;

    const mod = this.runtimeConfig?.modules.find(
      m => m.backend_service_id === item.target_service_id
        && m.endpoint_path === item.target_endpoint_path
        && m.metodo === item.target_endpoint_method
    );
    this.activeModule = mod || null;
  }

  isActiveItem(item: MenuItem): boolean {
    if (!this.activeModule) return false;
    return this.activeModule.backend_service_id === item.target_service_id
      && this.activeModule.endpoint_path === item.target_endpoint_path
      && this.activeModule.metodo === item.target_endpoint_method;
  }

  logout() {
    this.authService.clearCredentials();
    this.router.navigate(['/login'], { queryParams: { app: this.slug } });
  }

  retry() { this.loadApp(); }
}
