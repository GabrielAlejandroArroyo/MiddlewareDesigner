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
      
      <!-- Formulario Alta Optimizado -->
      <div class="card shadow-sm border-0 p-4 mb-5 bg-light">
        <h5 class="card-title mb-3">Registrar por URL de OpenAPI</h5>
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
        <div class="form-text mt-2 text-muted">
          * El sistema extraerá automáticamente el servidor y el puerto desde la URL proporcionada.
        </div>
      </div>

      <!-- Listado y Análisis -->
      <div class="row">
        <div class="col-md-5">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-dark text-white fw-bold">Backends Registrados</div>
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
                  <button (click)="inspect(svc.id)" class="btn btn-sm btn-info text-white shadow-sm">Inspeccionar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inspector de Endpoints Dinámico -->
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
                    <th>Descripción del Endpoint</th>
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

    <style>
      .x-small { font-size: 0.75rem; }
      .scrollable-area { max-height: 600px; overflow-y: auto; }
      .badge-GET { background-color: #61affe; }
      .badge-POST { background-color: #49cc90; }
      .badge-PUT { background-color: #fca130; }
      .badge-DELETE { background-color: #f93e3e; }
      .badge-PATCH { background-color: #50e3c2; }
      .table th { font-size: 0.85rem; text-transform: uppercase; }
    </style>
  `
})
export class BackendManagementComponent implements OnInit {
  private service = inject(MiddlewareService);
  
  services: BackendService[] = [];
  newService: Partial<BackendService> = {};
  selectedInspection: any = null;

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
        alert('Servicio registrado. Se han extraído el host y puerto automáticamente.');
      },
      error: (err) => {
        console.error('Error detallado:', err);
        let msg = 'Error desconocido';
        if (err.error?.detail) {
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

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }
}
