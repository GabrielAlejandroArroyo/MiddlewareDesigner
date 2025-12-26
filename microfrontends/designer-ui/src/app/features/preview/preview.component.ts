import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiddlewareService, BackendService } from '../../core/services/middleware.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0 fw-bold">Previsualización de Aplicación</h2>
        <button class="btn btn-light border shadow-sm" (click)="loadEnabledServices()">
          Actualizar Datos
        </button>
      </div>

      <div class="row g-4">
        <!-- Sidebar: Servicios Habilitados -->
        <div class="col-md-3">
          <div class="card shadow-sm border-0 sticky-top" style="top: 20px">
            <div class="card-header bg-primary text-white fw-bold py-3">
              <i class="bi bi-list-nested me-2"></i> Módulos Generados
            </div>
            <div class="list-group list-group-flush">
              <div *ngIf="loading" class="p-4 text-center">
                <div class="spinner-border spinner-border-sm text-primary"></div>
              </div>
              
              <div *ngIf="!loading && services.length === 0" class="p-4 text-center text-muted small">
                No hay servicios habilitados aún.
              </div>

              <div *ngFor="let svc of services" class="list-group-item p-0">
                <button class="btn w-100 text-start py-3 px-4 border-0 rounded-0 d-flex justify-content-between align-items-center"
                        [class.bg-light]="selectedServiceId === svc.id"
                        (click)="selectService(svc.id)">
                  <div>
                    <span class="d-block fw-bold small text-primary">{{ svc.id | uppercase }}</span>
                    <span class="small text-muted">{{ svc.nombre }}</span>
                  </div>
                  <i class="bi bi-chevron-right small text-muted"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content: Dashboard de Previsualización -->
        <div class="col-md-9">
          <div *ngIf="!selectedServiceId" class="card shadow-sm border-0 bg-light py-5 text-center rounded-4">
            <div class="card-body">
              <i class="bi bi-grid-3x3-gap text-muted" style="font-size: 4rem"></i>
              <h4 class="mt-4 fw-bold">Selecciona un módulo para previsualizar</h4>
              <p class="text-muted mx-auto" style="max-width: 400px">
                Aquí verás cómo interactúan los componentes generados a partir de los contratos OpenAPI habilitados en el middleware.
              </p>
            </div>
          </div>

          <div *ngIf="selectedServiceId && inspectionData" class="animate-in">
            <div class="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
              <div class="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h3 class="fw-bold mb-1 text-dark">{{ inspectionData.service_name }}</h3>
                  <p class="text-muted mb-0">Visualizando componentes activos del microservicio</p>
                </div>
                <span class="badge bg-success-subtle text-success px-3 py-2 border border-success border-opacity-25">
                  Módulo Operativo
                </span>
              </div>
            </div>

            <!-- Grid de Acciones Habilitadas -->
            <div class="row g-4">
              <div *ngFor="let ep of enabledEndpoints" class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0 border-top border-4 action-card shadow-hover"
                     [ngClass]="getBorderClass(ep.method)">
                  <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <span class="badge" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                      <code class="x-small text-muted">{{ ep.path }}</code>
                    </div>
                    <h5 class="fw-bold mb-2">{{ ep.configuracion_ui?.label || ep.summary || 'Acción sin nombre' }}</h5>
                    <p class="small text-muted mb-4">{{ ep.configuracion_ui?.description || 'Sin descripción adicional.' }}</p>
                    
                    <div class="mt-auto pt-3 border-top d-flex align-items-center justify-content-between">
                      <span class="small text-muted"><i class="bi bi-ui-checks me-1"></i> Componente {{ getComponentType(ep.method) }}</span>
                      <button [routerLink]="['/inspect', selectedServiceId, 'action-definition']" 
                              [queryParams]="{ path: ep.path, method: ep.method }"
                              class="btn btn-sm btn-link p-0">Configurar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .x-small { font-size: 0.7rem; }
      .badge-GET { background-color: #61affe; }
      .badge-POST { background-color: #49cc90; }
      .badge-PUT { background-color: #fca130; }
      .badge-DELETE { background-color: #f93e3e; }
      .badge-PATCH { background-color: #50e3c2; }
      
      .border-GET { border-color: #61affe !important; }
      .border-POST { border-color: #49cc90 !important; }
      .border-PUT { border-color: #fca130 !important; }
      .border-DELETE { border-color: #f93e3e !important; }
      .border-PATCH { border-color: #50e3c2 !important; }

      .action-card { transition: all 0.3s ease; }
      .shadow-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; cursor: pointer; }
      
      .animate-in { animation: fadeIn 0.4s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
  `
})
export class PreviewComponent implements OnInit {
  private middlewareService = inject(MiddlewareService);
  
  services: BackendService[] = [];
  loading = true;
  selectedServiceId: string | null = null;
  inspectionData: any = null;
  enabledEndpoints: any[] = [];

  ngOnInit() {
    this.loadEnabledServices();
  }

  loadEnabledServices() {
    this.loading = true;
    this.middlewareService.getBackendServices(false).subscribe({
      next: (data) => {
        this.services = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectService(id: string) {
    this.selectedServiceId = id;
    this.loading = true;
    this.middlewareService.inspectService(id).subscribe({
      next: (data) => {
        this.inspectionData = data;
        this.enabledEndpoints = data.endpoints.filter((e: any) => e.is_enabled);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }

  getBorderClass(method: string): string {
    return `border-${method}`;
  }

  getComponentType(method: string): string {
    if (method === 'GET') return 'Grilla';
    if (method === 'POST') return 'Formulario';
    if (method === 'DELETE') return 'Diálogo';
    return 'Editor';
  }
}

