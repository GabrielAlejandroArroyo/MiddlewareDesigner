import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MiddlewareService, Endpoint } from '../../core/services/middleware.service';

@Component({
  selector: 'app-endpoint-inspector',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Encabezado -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item"><a routerLink="/">Gestión de Microservicios</a></li>
              <li class="breadcrumb-item active" aria-current="page">Inspección de Contrato</li>
            </ol>
          </nav>
          <h2 class="mb-0 fw-bold text-primary" *ngIf="inspectionData">
            {{ inspectionData.service_name }}
          </h2>
          <p class="text-muted mb-0 small" *ngIf="inspectionData">ID: {{ inspectionData.service_id }}</p>
        </div>
        <button class="btn btn-light border shadow-sm" routerLink="/">
          Volver al listado
        </button>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Analizando contrato y definiciones...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger shadow-sm border-0 animate-in">
        <h5 class="alert-heading fw-bold">Error de Inspección</h5>
        <p class="mb-0">{{ error }}</p>
        <hr>
        <button class="btn btn-sm btn-outline-danger" (click)="loadInspection()">Reintentar</button>
      </div>

      <!-- Tabla de Endpoints -->
      <div *ngIf="inspectionData && !loading" class="card shadow-sm border-0 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 80px" class="ps-4">ESTADO</th>
                <th style="width: 100px">MÉTODO</th>
                <th>RUTA (ENDPOINT)</th>
                <th>DESCRIPCIÓN</th>
                <th class="text-end pe-4">CONFIGURACIÓN</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ep of inspectionData.endpoints" [class.table-active]="ep.is_enabled">
                <td class="ps-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input pointer" type="checkbox" 
                           [checked]="ep.is_enabled"
                           (change)="toggleEndpoint(ep)">
                  </div>
                </td>
                <td>
                  <span class="badge w-100 py-2" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                </td>
                <td>
                  <code class="text-primary fw-bold fs-6">{{ ep.path }}</code>
                </td>
                <td>
                  <span class="text-muted small">{{ ep.summary || 'Sin descripción' }}</span>
                </td>
                <td class="text-end pe-4">
                  <button *ngIf="ep.is_enabled" 
                          (click)="openDefinitionModal(ep)"
                          class="btn btn-sm btn-primary shadow-sm">
                    Definir Acción
                  </button>
                  <span *ngIf="!ep.is_enabled" class="text-muted small italic">Deshabilitado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Definición de Acción -->
    <div *ngIf="selectedEndpoint" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in">
        <div class="p-3 border-bottom bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold">Configurar Acción: {{ selectedEndpoint.path }}</h5>
          <button (click)="selectedEndpoint = null" class="btn-close btn-close-white"></button>
        </div>
        
        <div class="p-4 scrollable-modal-content">
          <!-- Pestañas Simples -->
          <ul class="nav nav-pills mb-3 bg-light p-1 rounded-3">
            <li class="nav-item flex-grow-1 text-center">
              <button class="nav-link w-100 py-1 small" [class.active]="activeTab === 'params'" (click)="activeTab = 'params'">Parámetros</button>
            </li>
            <li class="nav-item flex-grow-1 text-center">
              <button class="nav-link w-100 py-1 small" [class.active]="activeTab === 'request'" (click)="activeTab = 'request'">Request DTO</button>
            </li>
            <li class="nav-item flex-grow-1 text-center">
              <button class="nav-link w-100 py-1 small" [class.active]="activeTab === 'response'" (click)="activeTab = 'response'">Response DTO</button>
            </li>
          </ul>

          <!-- Contenido Pestaña: Parámetros -->
          <div *ngIf="activeTab === 'params'">
            <h6 class="fw-bold mb-3 small text-uppercase text-muted">Parámetros de Entrada</h6>
            <div *ngIf="!selectedEndpoint.parameters || selectedEndpoint.parameters.length === 0" class="text-muted small py-3 text-center">
              No se definieron parámetros para este endpoint.
            </div>
            <div class="list-group mb-3">
              <div *ngFor="let p of selectedEndpoint.parameters" class="list-group-item border-0 bg-light mb-2 rounded-3">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="badge bg-secondary me-2">{{ p.in }}</span>
                    <strong class="text-dark">{{ p.name }}</strong>
                  </div>
                  <span class="small text-muted">{{ p.schema?.type || 'string' }}</span>
                </div>
                <div class="small text-muted mt-1" *ngIf="p.description">{{ p.description }}</div>
              </div>
            </div>
          </div>

          <!-- Contenido Pestaña: Request DTO -->
          <div *ngIf="activeTab === 'request'">
            <h6 class="fw-bold mb-3 small text-uppercase text-muted">Modelo de Entrada (Request)</h6>
            <div *ngIf="!selectedEndpoint.request_dto" class="text-muted small py-3 text-center">
              Este método no requiere un cuerpo de mensaje (Body).
            </div>
            <div *ngIf="selectedEndpoint.request_dto" class="bg-dark text-info p-3 rounded-3 font-monospace small overflow-auto" style="max-height: 250px">
              <pre class="mb-0">interface {{ selectedEndpoint.request_dto.name }} &#123;</pre>
              <div *ngFor="let prop of selectedEndpoint.request_dto.properties | keyvalue" class="ms-3">
                {{ prop.key }}: {{ getPropType(prop.value) }};
              </div>
              <pre class="mb-0">&#125;</pre>
            </div>
          </div>

          <!-- Contenido Pestaña: Response DTO -->
          <div *ngIf="activeTab === 'response'">
            <h6 class="fw-bold mb-3 small text-uppercase text-muted">Modelo de Salida (Response)</h6>
            <div *ngIf="!selectedEndpoint.response_dto" class="text-muted small py-3 text-center">
              No se detectó un modelo de respuesta estructurado.
            </div>
            <div *ngIf="selectedEndpoint.response_dto" class="bg-dark text-success p-3 rounded-3 font-monospace small overflow-auto" style="max-height: 250px">
              <pre class="mb-0">interface {{ selectedEndpoint.response_dto.name }} &#123;</pre>
              <div *ngFor="let prop of selectedEndpoint.response_dto.properties | keyvalue" class="ms-3">
                {{ prop.key }}: {{ getPropType(prop.value) }};
              </div>
              <pre class="mb-0">&#125;</pre>
            </div>
          </div>

          <div class="mt-4 pt-3 border-top">
            <div class="mb-3">
              <label class="form-label small fw-bold">Nombre de la Acción / Pantalla</label>
              <input type="text" class="form-control" [(ngModel)]="actionName" placeholder="Ej: Alta de País">
            </div>
            <div class="d-flex gap-2">
              <button (click)="selectedEndpoint = null" class="btn btn-light border flex-grow-1">Cerrar</button>
              <button (click)="saveActionDefinition()" class="btn btn-primary flex-grow-1 shadow-sm fw-bold">Guardar Definición</button>
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
      .table th { font-size: 0.75rem; text-transform: uppercase; color: #6c757d; }
      .pointer { cursor: pointer; }
      .italic { font-style: italic; }
      
      .custom-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
      }
      .custom-modal { max-width: 600px; width: 95%; max-height: 90vh; }
      .scrollable-modal-content { max-height: 70vh; overflow-y: auto; }
      
      .animate-in { animation: fadeIn 0.3s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
  `
})
export class EndpointInspectorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private middlewareService = inject(MiddlewareService);
  
  inspectionData: any = null;
  loading = true;
  error: string | null = null;

  // Modal State
  selectedEndpoint: Endpoint | null = null;
  activeTab: 'params' | 'request' | 'response' = 'params';
  actionName: string = '';

  ngOnInit() {
    this.loadInspection();
  }

  loadInspection() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading = true;
    this.error = null;

    this.middlewareService.inspectService(id).subscribe({
      next: (data) => {
        this.inspectionData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || err.message || 'Error desconocido al cargar contrato';
        this.loading = false;
      }
    });
  }

  toggleEndpoint(ep: Endpoint) {
    if (!this.inspectionData) return;

    if (ep.is_enabled) {
      // Deshabilitar
      this.middlewareService.removeEndpointMapping(
        this.inspectionData.service_id,
        ep.path,
        ep.method
      ).subscribe({
        next: () => {
          ep.is_enabled = false;
          ep.configuracion_ui = {};
        },
        error: (err) => alert('No se pudo deshabilitar: ' + err.message)
      });
    } else {
      // Habilitar (con config vacía por defecto)
      const mapping = {
        backend_service_id: this.inspectionData.service_id,
        endpoint_path: ep.path,
        metodo: ep.method,
        frontend_service_id: 'default',
        configuracion_ui: {
          label: ep.summary || ep.path,
          parameters: ep.parameters,
          request_dto: ep.request_dto,
          response_dto: ep.response_dto
        }
      };

      this.middlewareService.toggleEndpointMapping(mapping).subscribe({
        next: () => {
          ep.is_enabled = true;
          ep.configuracion_ui = mapping.configuracion_ui;
        },
        error: (err) => alert('No se pudo habilitar: ' + err.message)
      });
    }
  }

  openDefinitionModal(ep: Endpoint) {
    this.selectedEndpoint = ep;
    this.activeTab = 'params';
    this.actionName = ep.configuracion_ui?.label || ep.summary || '';
  }

  saveActionDefinition() {
    if (!this.selectedEndpoint || !this.inspectionData) return;

    const mapping = {
      backend_service_id: this.inspectionData.service_id,
      endpoint_path: this.selectedEndpoint.path,
      metodo: this.selectedEndpoint.method,
      frontend_service_id: 'default',
      configuracion_ui: {
        ...this.selectedEndpoint.configuracion_ui,
        label: this.actionName,
        // Mantener los DTOs y params por defecto si no se modifican
        parameters: this.selectedEndpoint.parameters,
        request_dto: this.selectedEndpoint.request_dto,
        response_dto: this.selectedEndpoint.response_dto
      }
    };

    this.middlewareService.toggleEndpointMapping(mapping).subscribe({
      next: () => {
        if (this.selectedEndpoint) {
          this.selectedEndpoint.configuracion_ui = mapping.configuracion_ui;
          this.selectedEndpoint = null;
        }
        alert('Definición guardada correctamente');
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }

  getPropType(propValue: any): string {
    return propValue?.type || 'any';
  }
}

