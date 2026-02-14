import { bootstrapApplication } from '@angular/platform-browser';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Routes, RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { BackendManagementComponent } from './app/features/backend-management/backend-management.component';
import { EndpointInspectorComponent } from './app/features/endpoint-inspector/endpoint-inspector.component';
import { ActionDefinitionComponent } from './app/features/action-definition/action-definition.component';
import { PreviewComponent } from './app/features/preview/preview.component';
import { CustomPageDesignerComponent } from './app/features/custom-page-designer/custom-page-designer.component';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { LoginComponent } from './app/features/login/login.component';
import { CambiarPasswordComponent } from './app/features/cambiar-password/cambiar-password.component';
import { ThemeService } from './app/core/services/theme.service';
import { AuthService } from './app/core/services/auth.service';
import { InactivityWatcherService } from './app/core/services/inactivity-watcher.service';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { authGuard } from './app/core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'backends', component: BackendManagementComponent, canActivate: [authGuard] },
  { path: 'preview', component: PreviewComponent, canActivate: [authGuard] },
  { path: 'custom-designer', component: CustomPageDesignerComponent, canActivate: [authGuard] },
  { path: 'inspect/:id', component: EndpointInspectorComponent, canActivate: [authGuard] },
  { path: 'inspect/:id/action-definition', component: ActionDefinitionComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  template: `
    <router-outlet *ngIf="isLoginRoute()"></router-outlet>
    <div class="d-flex h-100 vh-100 overflow-hidden" *ngIf="!isLoginRoute()">
      <!-- Sidebar Vertical -->
      <aside class="sidebar bg-dark text-white shadow d-flex flex-column transition-all" 
             [class.collapsed]="isCollapsed">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 overflow-hidden" *ngIf="!isCollapsed">
            <div class="bg-info rounded-circle flex-shrink-0 shadow-sm" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-cpu text-dark small"></i>
            </div>
            <span class="fw-bold fs-5 text-nowrap">Designer</span>
          </div>
          <button class="btn btn-dark btn-sm rounded-circle shadow-none border-0" (click)="isCollapsed = !isCollapsed">
            <i class="bi" [class.bi-list]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
          </button>
        </div>

        <nav class="sidebar-nav flex-grow-1 py-3 px-2">
          <ul class="nav flex-column gap-2">
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm" 
                 [routerLinkActiveOptions]="{exact: true}"
                 [title]="isCollapsed ? 'Dashboard' : ''">
                <i class="bi bi-grid-1x2-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Panel Principal</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/backends" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Gestión' : ''">
                <i class="bi bi-gear-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Gestión Backends</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/preview" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Previsualización' : ''">
                <i class="bi bi-eye-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Previsualización</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/custom-designer" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Creación de Página Customizadas' : ''">
                <i class="bi bi-layout-text-window-reverse fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Diseño de Flujos</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="sidebar-footer p-3 border-top border-secondary border-opacity-25" *ngIf="!isCollapsed">
          <div class="small text-muted text-center">v1.2.0-beta</div>
          <button class="btn btn-sm btn-outline-secondary w-100 mt-2" (click)="logout()" *ngIf="authService.isLoggedIn()" title="Cerrar sesión">
            <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-grow-1 overflow-auto main-content-area d-flex flex-column">
        <header class="app-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between shadow-sm sticky-header">
          <h5 class="mb-0 fw-bold d-lg-none me-3" *ngIf="isCollapsed">
            <span class="text-info">MD</span>
          </h5>
          <h5 class="mb-0 fw-bold">Middleware Designer</h5>
          
          <!-- Toggle de Tema, usuario y logout -->
          <div class="d-flex align-items-center gap-2">
            <span class="small text-muted me-2" *ngIf="authService.username() as u">{{ u }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-2"
                    (click)="logout()" *ngIf="authService.isLoggedIn()" title="Cerrar sesión">
              <i class="bi bi-box-arrow-right"></i>
              <span class="d-none d-md-inline fw-bold">Cerrar sesión</span>
            </button>
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-2" 
                    (click)="themeService.toggleTheme()"
                    [title]="themeService.currentTheme() === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'">
              <i class="bi" [ngClass]="themeService.currentTheme() === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'"></i>
              <span class="d-none d-md-inline fw-bold">{{ themeService.currentTheme() === 'light' ? 'Oscuro' : 'Claro' }}</span>
            </button>
          </div>
        </header>
        <main class="p-0 flex-grow-1 overflow-auto main-content-wrapper">
          <div class="router-outlet-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>

    <!-- Modal de sesión expirada por inactividad -->
    <div *ngIf="showInactivityModal" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 rounded-4 overflow-hidden animate-in" style="max-width: 420px;">
        <div class="p-4 border-bottom bg-warning bg-opacity-10 d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
          <h4 class="mb-0 fw-bold text-warning">Sesión expirada por inactividad</h4>
        </div>
        <div class="p-4">
          <p class="mb-4">Ha permanecido inactivo durante demasiado tiempo. Será redirigido al inicio de sesión.</p>
          <button type="button" class="btn btn-primary w-100 py-2 fw-bold" (click)="onInactivityModalConfirm()">
            Entendido
          </button>
        </div>
      </div>
    </div>

    <style>
      .sidebar { 
        width: 280px; 
        min-width: 280px; 
        z-index: 1000;
        background-color: var(--md-sidebar-bg) !important;
        color: var(--md-sidebar-text);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .sidebar.collapsed { width: 80px; min-width: 80px; }
      .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      
      .nav-link { 
        color: var(--md-sidebar-text);
        opacity: 0.7;
        text-decoration: none; 
      }
      .nav-link:hover { 
        color: var(--md-sidebar-text); 
        background: var(--md-sidebar-hover);
        opacity: 1;
      }
      .nav-link.active { 
        font-weight: 600;
        opacity: 1;
      }
      
      aside.collapsed .nav-link { justify-content: center; padding: 1rem !important; }
      aside.collapsed .sidebar-header { justify-content: center !important; }
      
      .main-content-area {
        background-color: var(--md-bg-secondary);
      }
      
      .app-header {
        background-color: var(--md-header-bg);
        color: var(--md-header-text);
        border-color: var(--md-border-color);
      }

      .sticky-header {
        position: fixed;
        top: 0;
        z-index: 200;
        background-color: var(--md-header-bg) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        flex-shrink: 0;
        box-shadow: 0 2px 8px var(--md-shadow-sm) !important;
        height: 60px;
        display: flex;
        align-items: center;
        width: calc(100% - 280px);
        left: 280px;
      }

      /* Ajustar posición del header cuando sidebar está colapsado */
      aside.collapsed ~ .main-content-area .sticky-header {
        width: calc(100% - 80px);
        left: 80px;
      }

      .main-content-area {
        position: relative;
        padding-top: 60px !important;
      }

      .main-content-wrapper {
        position: relative;
        z-index: 1;
        min-height: 0;
        width: 100%;
        height: 100%;
      }
      
      body { overflow: hidden; }
    </style>
  `
})
export class App implements OnInit, OnDestroy {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  inactivityWatcher = inject(InactivityWatcherService);
  router = inject(Router);
  isCollapsed = true;
  showInactivityModal = false;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.updateInactivityWatcher();
    this.subs.push(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      ).subscribe(() => this.updateInactivityWatcher()),
      this.inactivityWatcher.inactivityDetected$.subscribe(() => {
        this.showInactivityModal = true;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.inactivityWatcher.stop();
  }

  private updateInactivityWatcher(): void {
    if (!this.isLoginRoute() && this.authService.isLoggedIn() && this.authService.sessionInactivityMinutes() > 0) {
      this.inactivityWatcher.start(this.authService.sessionInactivityMinutes());
    } else {
      this.inactivityWatcher.stop();
    }
  }

  isLoginRoute(): boolean {
    const u = this.router.url;
    return u === '/login' || u.startsWith('/login?') || u === '/cambiar-password' || u.startsWith('/cambiar-password?');
  }

  logout(): void {
    this.authService.clearCredentials();
    this.inactivityWatcher.stop();
    this.router.navigate(['/login']);
  }

  onInactivityModalConfirm(): void {
    this.showInactivityModal = false;
    this.inactivityWatcher.stop();
    this.authService.clearCredentials();
    this.router.navigate(['/login']);
  }
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
