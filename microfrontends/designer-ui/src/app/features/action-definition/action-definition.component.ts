import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MiddlewareService, Endpoint } from '../../core/services/middleware.service';

@Component({
  selector: 'app-action-definition',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Encabezado -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item"><a routerLink="/">Gestión</a></li>
              <li class="breadcrumb-item"><a [routerLink]="['/inspect', serviceId]">Contrato</a></li>
              <li class="breadcrumb-item active" aria-current="page">Definir Acción</li>
            </ol>
          </nav>
          <h2 class="mb-0 fw-bold text-primary">
            Configurar Acción: <code class="text-dark">{{ path }}</code>
          </h2>
          <div class="mt-2">
            <span class="badge py-2 px-3" [ngClass]="getMethodClass(method)">{{ method }}</span>
            <span class="ms-2 text-muted small">Servicio: {{ serviceId }}</span>
          </div>
        </div>
        <button class="btn btn-light border shadow-sm" [routerLink]="['/inspect', serviceId]">
          Cancelar y Volver
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Cargando detalles del endpoint...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger shadow-sm border-0 animate-in">
        <h5 class="alert-heading fw-bold">Error</h5>
        <p class="mb-0">{{ error }}</p>
        <hr>
        <button class="btn btn-sm btn-outline-danger" (click)="loadEndpointDetails()">Reintentar</button>
      </div>

      <div *ngIf="endpoint && !loading" class="row g-4">
        <!-- Columna Izquierda: Configuración -->
        <div class="col-lg-5">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0 fw-bold">Propiedades de la Acción</h5>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <label class="form-label small fw-bold text-uppercase text-muted">Nombre de la Acción / Pantalla</label>
                <input type="text" class="form-control form-control-lg" [(ngModel)]="actionName" 
                       placeholder="Ej: Alta de Nuevo País">
                <div class="form-text">Este nombre se usará como título en la interfaz generada.</div>
              </div>

              <div class="mb-4">
                <label class="form-label small fw-bold text-uppercase text-muted">Descripción del Proceso</label>
                <textarea class="form-control" rows="3" [(ngModel)]="actionDescription"
                          placeholder="Describe brevemente qué hace esta acción..."></textarea>
              </div>

              <div class="alert alert-info border-0 bg-info bg-opacity-10 small mb-4">
                <div class="d-flex gap-2">
                  <i class="bi bi-info-circle-fill"></i>
                  <span>Al guardar, el middleware registrará estos metadatos para la generación automática de la UI.</span>
                </div>
              </div>

              <button (click)="saveDefinition()" class="btn btn-primary btn-lg w-100 shadow-sm fw-bold mt-2">
                Guardar Definición de Acción
              </button>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Análisis de DTOs -->
        <div class="col-lg-7">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white p-0 overflow-hidden">
              <ul class="nav nav-tabs border-bottom-0">
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'params'" (click)="activeTab = 'params'">PARÁMETROS</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'request'" (click)="changeMainTab('request')">REQUEST DTO</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'response'" (click)="changeMainTab('response')">RESPONSE DTO</button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Contenido Pestaña: Parámetros -->
              <div *ngIf="activeTab === 'params'">
                <div *ngIf="!endpoint?.parameters || endpoint?.parameters?.length === 0" class="text-center py-5 text-muted">
                  <p class="mb-0 italic">No se detectaron parámetros de entrada (query/path).</p>
                </div>
                <div class="list-group list-group-flush" *ngIf="endpoint?.parameters && endpoint?.parameters!.length > 0">
                  <div *ngFor="let p of endpoint?.parameters" class="list-group-item px-0 border-light py-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="badge bg-secondary-subtle text-secondary border me-2">{{ p.in }}</span>
                        <strong class="text-dark">{{ p.name }}</strong>
                      </div>
                      <span class="text-primary small fw-bold font-monospace">{{ p.schema?.type || 'string' }}</span>
                    </div>
                    <p class="small text-muted mt-1 mb-0" *ngIf="p.description">{{ p.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Contenido Pestaña: DTOs -->
              <div *ngIf="activeTab === 'request' || activeTab === 'response'">
                <div *ngIf="detectedDtos.length === 0" class="text-center py-5 text-muted bg-light rounded-3">
                  <p class="mb-0 italic">No se detectaron modelos estructurados para esta sección.</p>
                </div>

                <div *ngIf="detectedDtos.length > 0">
                  <div class="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                    <button *ngFor="let dto of detectedDtos" 
                            (click)="activeDtoId = dto.name"
                            class="btn btn-sm py-1 px-3 rounded-pill"
                            [class.btn-info]="activeDtoId === dto.name"
                            [class.text-white]="activeDtoId === dto.name"
                            [class.btn-outline-secondary]="activeDtoId !== dto.name">
                      {{ dto.name }}
                    </button>
                  </div>

                  <div *ngFor="let dto of detectedDtos">
                    <div *ngIf="activeDtoId === dto.name" class="bg-dark p-4 rounded-4 font-monospace small overflow-auto animate-in shadow-inner" style="max-height: 450px">
                      <div class="mb-1">
                        <span class="text-warning">interface</span> <span class="text-info">{{ dto.name }}</span> <span class="text-white">&#123;</span>
                        <div *ngFor="let prop of dto.properties | keyvalue" class="ms-4 my-1">
                          <span class="text-light">{{ prop.key }}</span><span class="text-white">:</span> 
                          <span [ngClass]="getPropColor(prop.value)">{{ getSimplePropType(prop.value) }}</span><span class="text-white">;</span>
                        </div>
                        <span class="text-white">&#125;</span>
                      </div>
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
      .badge-GET { background-color: #61affe; }
      .badge-POST { background-color: #49cc90; }
      .badge-PUT { background-color: #fca130; }
      .badge-DELETE { background-color: #f93e3e; }
      .badge-PATCH { background-color: #50e3c2; }
      
      .nav-tabs .nav-link { color: #6c757d; border: none; border-bottom: 3px solid transparent; }
      .nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 3px solid #0d6efd; background: transparent; }
      
      .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
      .animate-in { animation: fadeIn 0.3s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .text-primary { color: #61affe !important; }
      .text-success { color: #49cc90 !important; }
      .text-info { color: #50e3c2 !important; }
    </style>
  `
})
export class ActionDefinitionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private middlewareService = inject(MiddlewareService);

  serviceId: string = '';
  path: string = '';
  method: string = '';
  
  endpoint: Endpoint | null = null;
  loading = true;
  error: string | null = null;

  // UI State
  activeTab: 'params' | 'request' | 'response' = 'params';
  actionName: string = '';
  actionDescription: string = '';
  detectedDtos: any[] = [];
  activeDtoId: string = '';

  ngOnInit() {
    this.serviceId = this.route.snapshot.paramMap.get('id') || '';
    this.path = this.route.snapshot.queryParamMap.get('path') || '';
    this.method = this.route.snapshot.queryParamMap.get('method') || '';
    
    if (!this.serviceId || !this.path || !this.method) {
      this.error = "Faltan parámetros necesarios para identificar el endpoint.";
      this.loading = false;
      return;
    }

    this.loadEndpointDetails();
  }

  loadEndpointDetails() {
    this.loading = true;
    this.middlewareService.inspectService(this.serviceId).subscribe({
      next: (data) => {
        const found = data.endpoints.find((e: Endpoint) => e.path === this.path && e.method === this.method);
        if (found) {
          this.endpoint = found;
          this.actionName = found.configuracion_ui?.label || found.summary || '';
          this.actionDescription = found.configuracion_ui?.description || '';
        } else {
          this.error = "No se encontró la definición del endpoint solicitado.";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Error al conectar con el middleware.";
        this.loading = false;
      }
    });
  }

  changeMainTab(tab: 'request' | 'response') {
    this.activeTab = tab;
    this.updateDetectedDtos();
  }

  updateDetectedDtos() {
    const rootDto = this.activeTab === 'request' ? this.endpoint?.request_dto : this.endpoint?.response_dto;
    this.detectedDtos = [];
    if (rootDto) {
      this.extractAllDtos(rootDto);
      if (this.detectedDtos.length > 0) {
        this.activeDtoId = this.detectedDtos[0].name;
      }
    }
  }

  extractAllDtos(dto: any) {
    if (!dto || !dto.name) return;
    if (this.detectedDtos.find(d => d.name === dto.name)) return;
    this.detectedDtos.push(dto);
    if (dto.properties) {
      Object.values(dto.properties).forEach((prop: any) => {
        if (prop.properties) this.extractAllDtos(prop);
        else if (prop.type === 'array' && prop.items?.properties) this.extractAllDtos(prop.items);
      });
    }
  }

  getSimplePropType(prop: any): string {
    if (prop.type === 'array') {
      const itemName = prop.items?.name || prop.items?.type || 'any';
      return `${itemName}[]`;
    }
    return prop.name || prop.type || 'any';
  }

  getPropColor(prop: any): string {
    if (prop.properties || (prop.type === 'array' && prop.items?.properties)) return 'text-info';
    if (prop.type === 'array') return 'text-success';
    return 'text-primary';
  }

  saveDefinition() {
    if (!this.endpoint) return;

    const mapping = {
      backend_service_id: this.serviceId,
      endpoint_path: this.path,
      metodo: this.method,
      frontend_service_id: 'default',
      configuracion_ui: {
        ...this.endpoint.configuracion_ui,
        label: this.actionName,
        description: this.actionDescription,
        parameters: this.endpoint.parameters,
        request_dto: this.endpoint.request_dto,
        response_dto: this.endpoint.response_dto
      }
    };

    this.middlewareService.toggleEndpointMapping(mapping).subscribe({
      next: () => {
        alert('Definición guardada correctamente');
        this.router.navigate(['/inspect', this.serviceId]);
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }
}

