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
    <div class="container-fluid px-4 py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0 fw-bold text-dark">Panel de Control del Ecosistema</h2>
          <p class="text-muted mb-0">Estado en tiempo real de todos los microservicios generados.</p>
        </div>
        <button class="btn btn-outline-primary shadow-sm" (click)="checkHealthAll()">
          <i class="bi bi-arrow-repeat me-2"></i> Actualizar Estado
        </button>
      </div>

      <div class="row g-4">
        <!-- Stats Summary -->
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white rounded-4 p-3">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-white bg-opacity-20 me-3" style="width: 48px; height: 48px">
                <i class="bi bi-cpu fs-4"></i>
              </div>
              <div>
                <div class="small opacity-75">Servicios Totales</div>
                <div class="fs-3 fw-bold">{{ services.length }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white rounded-4 p-3">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-white bg-opacity-20 me-3" style="width: 48px; height: 48px">
                <i class="bi bi-check-circle fs-4"></i>
              </div>
              <div>
                <div class="small opacity-75">Operativos</div>
                <div class="fs-3 fw-bold">{{ onlineCount }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-danger text-white rounded-4 p-3">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-white bg-opacity-20 me-3" style="width: 48px; height: 48px">
                <i class="bi bi-exclamation-triangle fs-4"></i>
              </div>
              <div>
                <div class="small opacity-75">Caídos / Offline</div>
                <div class="fs-3 fw-bold">{{ services.length - onlineCount }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-info text-white rounded-4 p-3">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-white bg-opacity-20 me-3" style="width: 48px; height: 48px">
                <i class="bi bi-lightning-charge fs-4"></i>
              </div>
              <div>
                <div class="small opacity-75">Middleware</div>
                <div class="fs-3 fw-bold">ONLINE</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Microservices Grid -->
        <div class="col-12 mt-4">
          <h5 class="fw-bold mb-3"><i class="bi bi-grid-3x3-gap me-2"></i> Microservicios Generados</h5>
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
      .icon-circle { display: flex; align-items: center; justify-content: center; border-radius: 50%; }
      .service-card { transition: transform 0.2s; border: 1px solid transparent !important; }
      .service-card:hover { transform: translateY(-5px); border-color: rgba(var(--bs-primary-rgb), 0.1) !important; }
      .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
      .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .btn-white { background: white; color: #333; }
      .btn-white:hover { background: #f8f9fa; }
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
