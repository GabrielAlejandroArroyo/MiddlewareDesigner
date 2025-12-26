import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MiddlewareService, BackendService } from '../../core/services/middleware.service';

@Component({
  selector: 'app-backend-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid px-4">
      <h2 class="my-4">Gestión de Microservicios</h2>
      
      <!-- Formulario Alta -->
      <div class="card shadow-sm border-0 p-4 mb-5 bg-light">
        <h5 class="card-title mb-3 text-primary">Registrar por URL de OpenAPI</h5>
        <div class="row g-3">
          <div class="col-md-2">
            <label class="form-label small fw-bold">ID del Servicio</label>
            <input type="text" [(ngModel)]="newService.id" class="form-control" placeholder="ej: pais-api">
          </div>
          <div class="col-md-5">
            <label class="form-label small fw-bold">URL completa del openapi.json</label>
            <input type="text" [(ngModel)]="newService.openapi_url" class="form-control" placeholder="http://127.0.0.1:8000/openapi.json">
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold">Descriptor / Descripción</label>
            <input type="text" [(ngModel)]="newService.descripcion" class="form-control" placeholder="Servicio de gestión geográfica">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button (click)="register()" class="btn btn-primary w-100 shadow-sm">Registrar Backend</button>
          </div>
        </div>
      </div>

      <!-- Listado y Análisis -->
      <div class="row">
        <div class="col-md-5">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center fw-bold">
              <span>Backends Registrados</span>
              <button class="btn btn-sm btn-outline-light" (click)="loadServices()">Refrescar</button>
            </div>
            <div class="list-group list-group-flush">
              <div *ngIf="services.length === 0" class="p-4 text-center text-muted small">
                No hay servicios registrados aún.
              </div>
              <div *ngFor="let svc of services" class="list-group-item list-group-item-action p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge bg-secondary mb-1">{{ svc.id }}</span>
                    <h6 class="mb-1">{{ svc.nombre }}</h6>
                    <p class="small text-muted mb-1">{{ svc.descripcion }}</p>
                    <code class="x-small">{{ svc.host }}:{{ svc.puerto }}</code>
                  </div>
                  <div class="btn-group">
                    <button (click)="inspect(svc.id)" class="btn btn-sm btn-info text-white">Inspeccionar</button>
                    <button (click)="confirmDelete(svc)" class="btn btn-sm btn-danger">Eliminar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inspector de Endpoints -->
        <div class="col-md-7" *ngIf="selectedInspection">
          <div class="card shadow-sm border-0 border-start border-info border-4">
            <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0 text-info">Contrato: {{ selectedInspection.service_name }}</h5>
              <button class="btn-close" (click)="selectedInspection = null"></button>
            </div>
            <div class="card-body scrollable-area p-0">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 100px">Método</th>
                    <th>Ruta (Endpoint)</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let ep of selectedInspection.endpoints">
                    <td>
                      <span class="badge w-100" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                    </td>
                    <td><code class="text-primary">{{ ep.path }}</code></td>
                    <td class="small text-muted">{{ ep.summary || 'Sin descripción' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Simple de Eliminación -->
    <div *ngIf="serviceToDelete" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-4 bg-white rounded">
        <h4 class="text-danger mb-3">Eliminar Servicio: {{ serviceToDelete.id }}</h4>
        <p>¿Qué tipo de eliminación deseas realizar?</p>
        <div class="alert alert-warning small">
          <strong>Baja Definitiva:</strong> Borra el registro de la base de datos. Solo es posible si no hay mapeos activos.<br>
          <strong>Baja Lógica:</strong> Oculta el servicio de la lista pero mantiene su configuración.
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button (click)="serviceToDelete = null" class="btn btn-secondary">Cancelar</button>
          <button (click)="delete(false)" class="btn btn-outline-warning">Baja Lógica</button>
          <button (click)="delete(true)" class="btn btn-danger">Baja Definitiva</button>
        </div>
      </div>
    </div>

    <style>
      .x-small { font-size: 0.75rem; }
      .scrollable-area { max-height: 600px; overflow-y: auto; }
      .badge-GET { background-color: #61affe; }
      .badge-POST { background-color: #49cc90; }
      .badge-PUT { background-color: #fca130; }
      .badge-DELETE { background-color: #f93e3e; }
      .badge-PATCH { background-color: #50e3c2; }
      .table th { font-size: 0.85rem; text-transform: uppercase; }
      .custom-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
      }
      .custom-modal { max-width: 500px; width: 90%; }
    </style>
  `
})
export class BackendManagementComponent implements OnInit {
  private service = inject(MiddlewareService);
  
  services: BackendService[] = [];
  newService: Partial<BackendService> = {};
  selectedInspection: any = null;
  serviceToDelete: BackendService | null = null;

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.service.getBackendServices().subscribe(data => this.services = data);
  }

  register() {
    if (!this.newService.id || !this.newService.openapi_url) {
      alert('Por favor, ingresa el ID y la URL del openapi.json');
      return;
    }

    this.service.registerBackend(this.newService).subscribe({
      next: () => {
        this.loadServices();
        this.newService = {};
        alert('Servicio registrado correctamente.');
      },
      error: (err) => {
        console.error('Error detallado:', err);
        let msg = 'Error de comunicación con el Middleware.';
        
        if (err.status === 0) {
          msg = 'No se pudo conectar con el Middleware (Puerto 9000). Asegúrate de que el proceso esté corriendo y el CORS lo permita.';
        } else if (err.error?.detail) {
          msg = typeof err.error.detail === 'string' 
            ? err.error.detail 
            : JSON.stringify(err.error.detail, null, 2);
        } else {
          msg = err.message;
        }
        alert('Error al registrar:\n' + msg);
      }
    });
  }

  inspect(id: string) {
    this.service.inspectService(id).subscribe({
      next: (data) => {
        this.selectedInspection = data;
      },
      error: (err) => {
        alert('Error al leer el contrato: ' + (err.error?.detail || err.message));
      }
    });
  }

  confirmDelete(svc: BackendService) {
    this.serviceToDelete = svc;
  }

  delete(physical: boolean) {
    if (!this.serviceToDelete) return;

    this.service.deleteBackend(this.serviceToDelete.id, physical).subscribe({
      next: (res) => {
        alert(res.message);
        this.serviceToDelete = null;
        this.loadServices();
      },
      error: (err) => {
        const msg = err.error?.detail || err.message;
        alert('No se pudo eliminar:\n' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
      }
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }
}
