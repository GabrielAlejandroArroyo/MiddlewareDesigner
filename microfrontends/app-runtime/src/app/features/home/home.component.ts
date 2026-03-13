import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RuntimeService, AppInfo } from '../../core/services/runtime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-vh-100" style="background:var(--rt-bg-secondary, #f0f2f5)">
      <!-- Header -->
      <nav class="navbar shadow-sm px-4 py-3" style="background:var(--rt-header-bg, #fff)">
        <div class="container-fluid">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                 style="width:38px;height:38px">
              <i class="bi bi-grid-1x2-fill text-white"></i>
            </div>
            <div>
              <h5 class="mb-0 fw-bold">Aplicaciones</h5>
              <small class="text-muted">Seleccioná una aplicación para acceder</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
              <i class="bi bi-person-fill me-1"></i>{{ authService.username() }}
            </span>
            <button class="btn btn-sm btn-outline-secondary rounded-pill" (click)="themeService.toggleTheme()"
                    [title]="themeService.currentTheme() === 'light' ? 'Modo oscuro' : 'Modo claro'">
              <i class="bi" [class.bi-moon-stars-fill]="themeService.currentTheme() === 'light'"
                 [class.bi-sun-fill]="themeService.currentTheme() === 'dark'"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-pill" (click)="logout()">
              <i class="bi bi-box-arrow-right me-1"></i> Salir
            </button>
          </div>
        </div>
      </nav>

      <div class="container py-5">
        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3"></div>
          <p class="text-muted">Cargando aplicaciones...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error && !loading" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-3 text-warning"></i>
          <h5 class="mt-3">No se pudieron cargar las aplicaciones</h5>
          <p class="text-muted">{{ error }}</p>
          <button class="btn btn-primary" (click)="loadApps()">
            <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
          </button>
        </div>

        <!-- Sin apps -->
        <div *ngIf="!loading && !error && apps.length === 0" class="text-center py-5">
          <i class="bi bi-window-stack display-1 text-muted"></i>
          <h4 class="mt-3 text-muted">No hay aplicaciones disponibles</h4>
          <p class="text-muted">Aún no se configuraron aplicaciones en el sistema.</p>
        </div>

        <!-- Grid de apps -->
        <div class="row g-4" *ngIf="!loading && apps.length > 0">
          <div class="col-sm-6 col-lg-4 col-xl-3" *ngFor="let app of apps">
            <div class="card border-0 shadow-sm h-100 app-card" (click)="openApp(app)" role="button">
              <div class="card-body p-4">
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="app-icon bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                       style="width:48px;height:48px">
                    <i class="bi bi-app-indicator fs-4"></i>
                  </div>
                  <div class="overflow-hidden">
                    <h6 class="fw-bold mb-0 text-truncate">{{ app.nombre }}</h6>
                    <small class="text-muted">/{{ app.slug }}</small>
                  </div>
                </div>
                <p class="text-muted small mb-3" style="min-height:40px">
                  {{ app.descripcion || 'Sin descripción' }}
                </p>
                <div class="d-flex flex-wrap gap-1">
                  <span class="badge bg-success bg-opacity-10 text-success small">
                    <i class="bi bi-check-circle me-1"></i>Activa
                  </span>
                  <span class="badge bg-info bg-opacity-10 text-info small">
                    <i class="bi bi-people me-1"></i>{{ app.roles?.length || 0 }} roles
                  </span>
                </div>
              </div>
              <div class="card-footer bg-transparent border-top p-3 d-flex align-items-center justify-content-between">
                <code class="small text-primary">{{ getAppUrl(app) }}</code>
                <i class="bi bi-arrow-right text-primary"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Rutas disponibles -->
        <div *ngIf="!loading && apps.length > 0" class="mt-5">
          <h6 class="fw-bold text-muted mb-3">
            <i class="bi bi-signpost-2 me-2"></i>Rutas disponibles
          </h6>
          <div class="card border-0 shadow-sm">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="small text-muted">
                    <th class="ps-4">Aplicación</th>
                    <th>Slug</th>
                    <th>URL de Acceso</th>
                    <th>Roles</th>
                    <th class="pe-4"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let app of apps" class="align-middle">
                    <td class="ps-4 fw-bold">{{ app.nombre }}</td>
                    <td><code>/{{ app.slug }}</code></td>
                    <td><code class="text-primary">{{ getAppUrl(app) }}</code></td>
                    <td>
                      <span class="badge bg-secondary bg-opacity-10 text-secondary me-1"
                            *ngFor="let r of app.roles">{{ r.role_nombre }}</span>
                    </td>
                    <td class="pe-4 text-end">
                      <button class="btn btn-sm btn-primary" (click)="openApp(app)">
                        <i class="bi bi-box-arrow-up-right me-1"></i> Acceder
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .app-card {
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
      }
      .app-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
      }
      .app-card:hover .app-icon {
        background-color: rgba(13,110,253,0.2) !important;
      }
    </style>
  `
})
export class HomeComponent implements OnInit {
  private runtimeService = inject(RuntimeService);
  private router = inject(Router);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  apps: AppInfo[] = [];
  loading = true;
  error = '';

  private baseUrl = '';

  ngOnInit() {
    this.baseUrl = `${window.location.protocol}//${window.location.host}`;
    this.loadApps();
  }

  loadApps() {
    this.loading = true;
    this.error = '';
    this.runtimeService.getAvailableApps().subscribe({
      next: (apps) => {
        this.apps = apps;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al obtener las aplicaciones';
        this.loading = false;
      }
    });
  }

  getAppUrl(app: AppInfo): string {
    return `${this.baseUrl}/${app.slug}`;
  }

  openApp(app: AppInfo) {
    this.router.navigate(['/', app.slug]);
  }

  logout() {
    this.authService.clearCredentials();
    this.router.navigate(['/login']);
  }
}
