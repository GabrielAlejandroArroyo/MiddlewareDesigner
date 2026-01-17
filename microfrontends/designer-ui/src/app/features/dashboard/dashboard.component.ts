import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MiddlewareService, BackendService } from '../../core/services/middleware.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ServiceHealth extends BackendService {
  status: 'online' | 'offline' | 'checking';
  version?: string;
  uptime?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid px-4 py-4 page-content-container">
      <!-- Header Flotante con Estadísticas -->
      <div class="dashboard-header-sticky">
        <div class="page-header-sticky">
          <div class="d-flex justify-content-between align-items-center py-3">
            <div>
              <nav aria-label="breadcrumb" class="mb-2">
                <ol class="breadcrumb mb-0">
                  <li class="breadcrumb-item">
                    <a routerLink="/" class="text-decoration-none">
                      <i class="bi bi-house-door me-1"></i>Inicio
                    </a>
                  </li>
                  <li class="breadcrumb-item active" aria-current="page">Panel de Control</li>
                </ol>
              </nav>
              <h2 class="mb-0 fw-bold">Panel de Control del Ecosistema</h2>
              <p class="text-muted mb-0 small mt-1">Estado en tiempo real de todos los microservicios generados.</p>
            </div>
            <button class="btn btn-outline-primary shadow-sm ms-3" (click)="checkHealthAll()">
              <i class="bi bi-arrow-repeat me-2"></i> Actualizar Estado
            </button>
          </div>
        </div>
        
        <div class="stats-container py-3">
          <div class="row g-4">
            <!-- Stats Summary -->
            <div class="col-md-3">
              <div class="card border-0 shadow-sm stat-card-primary rounded-4 p-3">
                <div class="d-flex align-items-center">
                  <div class="icon-circle stat-icon-primary me-3" style="width: 48px; height: 48px">
                    <i class="bi bi-cpu fs-4"></i>
                  </div>
                  <div>
                    <div class="small stat-label">Servicios Totales</div>
                    <div class="fs-3 fw-bold stat-value">{{ services.length }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 shadow-sm stat-card-success rounded-4 p-3">
                <div class="d-flex align-items-center">
                  <div class="icon-circle stat-icon-success me-3" style="width: 48px; height: 48px">
                    <i class="bi bi-check-circle fs-4"></i>
                  </div>
                  <div>
                    <div class="small stat-label">Operativos</div>
                    <div class="fs-3 fw-bold stat-value">{{ onlineCount }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 shadow-sm stat-card-danger rounded-4 p-3">
                <div class="d-flex align-items-center">
                  <div class="icon-circle stat-icon-danger me-3" style="width: 48px; height: 48px">
                    <i class="bi bi-exclamation-triangle fs-4"></i>
                  </div>
                  <div>
                    <div class="small stat-label">Caídos / Offline</div>
                    <div class="fs-3 fw-bold stat-value">{{ services.length - onlineCount }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 shadow-sm stat-card-info rounded-4 p-3">
                <div class="d-flex align-items-center">
                  <div class="icon-circle stat-icon-info me-3" style="width: 48px; height: 48px">
                    <i class="bi bi-lightning-charge fs-4"></i>
                  </div>
                  <div>
                    <div class="small stat-label">Middleware</div>
                    <div class="fs-3 fw-bold stat-value">ONLINE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Título de Microservicios Generados -->
        <div class="microservices-title-container py-3 border-top border-bottom">
          <h5 class="fw-bold mb-0"><i class="bi bi-grid-3x3-gap me-2"></i> Microservicios Generados</h5>
        </div>
      </div>

      <div class="row g-4 dashboard-content">
        <!-- Microservices Grid -->
        <div class="col-12">
          <div class="row g-4">
            <div *ngFor="let svc of services" class="col-md-6 col-lg-4 col-xl-3">
              <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden service-card">
                <div class="p-4">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="icon-box rounded-3 bg-light d-flex align-items-center justify-content-center" style="width: 40px; height: 40px">
                      <i class="bi bi-app-indicator text-primary"></i>
                    </div>
                    <span class="badge rounded-pill" 
                          [ngClass]="svc.status === 'online' ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'">
                      {{ svc.status | uppercase }}
                    </span>
                  </div>
                  
                  <h6 class="fw-bold mb-1 text-dark">{{ svc.nombre }}</h6>
                  <code class="x-small text-muted d-block mb-3">{{ svc.id }}</code>
                  
                  <div class="d-flex flex-column gap-2 border-top pt-3 mt-3">
                    <div class="d-flex justify-content-between x-small">
                      <span class="text-muted">Puerto:</span>
                      <span class="fw-bold">{{ svc.puerto }}</span>
                    </div>
                    <div class="d-flex justify-content-between x-small">
                      <span class="text-muted">Host:</span>
                      <span class="fw-bold">{{ svc.host }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-footer bg-light border-0 p-3">
                  <div class="d-flex gap-2">
                    <a [href]="'http://localhost:' + svc.puerto + '/docs'" target="_blank" class="btn btn-xs btn-white border flex-grow-1 shadow-xs fw-bold">
                      <i class="bi bi-book me-1"></i> SWAGGER
                    </a>
                    <button [routerLink]="['/inspect', svc.id]" class="btn btn-xs btn-primary flex-grow-1 shadow-xs fw-bold">
                      <i class="bi bi-search me-1"></i> GESTIONAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .icon-circle { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border-radius: 50%; 
        background-color: var(--md-bg-tertiary);
        color: var(--md-text-primary);
      }
      .service-card { 
        transition: transform 0.2s; 
        border: 1px solid transparent !important; 
        background-color: var(--md-card-bg);
        color: var(--md-text-primary);
      }
      .service-card:hover { 
        transform: translateY(-5px); 
        border-color: rgba(13, 110, 253, 0.1) !important; 
      }
      .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
      .shadow-xs { box-shadow: 0 1px 2px var(--md-shadow-sm); }

      /* Tarjetas de Estadísticas Adaptativas */
      .stat-card-primary {
        background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      [data-theme="dark"] .stat-card-primary {
        background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .stat-icon-primary {
        background-color: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
      }

      [data-theme="dark"] .stat-icon-primary {
        background-color: rgba(255, 255, 255, 0.25) !important;
        color: white !important;
      }

      .stat-card-success {
        background: linear-gradient(135deg, #198754 0%, #157347 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      [data-theme="dark"] .stat-card-success {
        background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .stat-icon-success {
        background-color: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
      }

      [data-theme="dark"] .stat-icon-success {
        background-color: rgba(255, 255, 255, 0.25) !important;
        color: white !important;
      }

      .stat-card-danger {
        background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      [data-theme="dark"] .stat-card-danger {
        background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .stat-icon-danger {
        background-color: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
      }

      [data-theme="dark"] .stat-icon-danger {
        background-color: rgba(255, 255, 255, 0.25) !important;
        color: white !important;
      }

      .stat-card-info {
        background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      [data-theme="dark"] .stat-card-info {
        background: linear-gradient(135deg, #00acc1 0%, #00838f 100%);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .stat-icon-info {
        background-color: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
      }

      [data-theme="dark"] .stat-icon-info {
        background-color: rgba(255, 255, 255, 0.25) !important;
        color: white !important;
      }

      .stat-label {
        opacity: 0.9;
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .stat-value {
        color: white !important;
      }

      /* Header Flotante Global */
      .page-header-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--md-bg-secondary);
        border-bottom: 1px solid var(--md-border-color);
        margin: -1rem -1rem 1.5rem -1rem;
        padding: 0 1rem;
        box-shadow: 0 2px 4px var(--md-shadow-sm);
        transition: all 0.3s ease;
      }

      .page-header-sticky .breadcrumb {
        background-color: transparent;
        padding: 0;
        margin: 0;
      }

      .page-header-sticky .breadcrumb-item a {
        color: var(--md-text-secondary);
        transition: color 0.2s ease;
        font-weight: 500;
      }

      .page-header-sticky .breadcrumb-item a:hover {
        color: #0d6efd;
        text-decoration: underline;
      }

      .page-header-sticky .breadcrumb-item.active {
        color: var(--md-text-primary);
        font-weight: 600;
      }

      .page-header-sticky .breadcrumb-item + .breadcrumb-item::before {
        color: var(--md-text-muted);
        content: "/";
        padding: 0 0.5rem;
      }

      .page-header-sticky h2 {
        color: var(--md-text-primary);
      }

      .page-header-sticky .text-muted {
        color: var(--md-text-secondary) !important;
      }

      /* Header Flotante del Dashboard con Estadísticas */
      .dashboard-header-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--md-bg-secondary) !important;
        border-bottom: 1px solid var(--md-border-color);
        margin: -1rem -1rem 0 -1rem;
        padding: 0 1rem 1rem 1rem;
        box-shadow: 0 2px 8px var(--md-shadow-sm);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .dashboard-header-sticky .page-header-sticky {
        position: relative;
        top: 0;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-bottom: none;
        background-color: transparent;
      }

      .dashboard-header-sticky .stats-container {
        background-color: transparent;
      }

      .dashboard-header-sticky .microservices-title-container {
        background-color: transparent;
        border-color: var(--md-border-color) !important;
      }

      .dashboard-header-sticky .microservices-title-container h5 {
        color: var(--md-text-primary);
      }

      .dashboard-content {
        margin-top: 1.5rem;
        padding-top: 1rem;
      }
    </style>
  `
})
export class DashboardComponent implements OnInit {
  private middlewareService = inject(MiddlewareService);
  private http = inject(HttpClient);

  services: ServiceHealth[] = [];
  onlineCount = 0;
  loading = true;

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.loading = true;
    this.middlewareService.getBackendServices(false).subscribe({
      next: (data) => {
        this.services = data.map(s => ({ ...s, status: 'checking' as const }));
        this.checkHealthAll();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  checkHealthAll() {
    const healthChecks = this.services.map(svc => {
      // Usar openapi_url directamente ya que es la URL completa y correcta
      const url = svc.openapi_url;
      return this.http.get(url).pipe(
        map(() => ({ id: svc.id, status: 'online' as const })),
        catchError(() => of({ id: svc.id, status: 'offline' as const }))
      );
    });

    forkJoin(healthChecks).subscribe(results => {
      this.onlineCount = 0;
      results.forEach(res => {
        const svc = this.services.find(s => s.id === res.id);
        if (svc) {
          svc.status = res.status;
          if (res.status === 'online') this.onlineCount++;
        }
      });
    });
  }
}
